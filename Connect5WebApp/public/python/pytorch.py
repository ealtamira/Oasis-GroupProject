import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np  # <--- ADD THIS IMPORT
import torch.onnx
from torch.utils.data import DataLoader, TensorDataset

# Load dataset
df = pd.read_csv("output_dataset.csv")

# --- CLEANING DATA (FIXES THE TYPEERROR) ---
# 1. Convert everything to numbers. If text is found, it becomes "NaN" (Not a Number)
df = df.apply(pd.to_numeric, errors='coerce')

# 2. Delete any row that contains an error/NaN
df = df.dropna()

# 3. Ensure the move_column is an integer (for the loss function)
df['move_column'] = df['move_column'].astype(np.int64)
# --------------------------------------------

# Extract features and target
X = df.drop(columns=["move_column"]).values  
y = df["move_column"].values                 

# Convert to PyTorch tensors (Explicitly set to float32 and int64)
X_tensor = torch.tensor(X.astype(np.float32))
y_tensor = torch.tensor(y, dtype=torch.long) 

# Create DataLoader for training
dataset = TensorDataset(X_tensor, y_tensor)
train_loader = DataLoader(dataset, batch_size=32, shuffle=True)

#-------------------------------------

class Connect5Net(nn.Module):
    def __init__(self):
        super(Connect5Net, self).__init__()
        self.fc1 = nn.Linear(42, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 7) 

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

# Create model
model = Connect5Net()

# Loss function and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training loop
epochs = 100
loss = torch.tensor(0.0)

for epoch in range(epochs):
    if len(train_loader) == 0:
        print("❌ Error: train_loader is empty! Check your CSV data.")
        break

    for X_batch, y_batch in train_loader:
        optimizer.zero_grad()
        outputs = model(X_batch)
        loss = criterion(outputs, y_batch)
        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch+1}/{epochs}, Loss: {loss.item():.4f}")

# Save trained model
torch.save(model.state_dict(), "connect5_model.pth")
print("✅ Model trained and saved!")

#--------------------------------------------------------------

# Load trained model for Export
model = Connect5Net()
model.load_state_dict(torch.load("connect5_model.pth"))
model.eval()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
dummy_input = torch.randn(1, 42, dtype=torch.float32).to(device)

# Export to ONNX format
onnx_filename = "connect5_model.onnx"
torch.onnx.export(
    model,
    (dummy_input,),
    onnx_filename,
    input_names=["input"],
    output_names=["output"],
    opset_version=11
)

print(f"✅ Model converted to ONNX: {onnx_filename}")