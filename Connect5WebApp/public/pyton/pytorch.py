import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import torch.onnx
from torch.utils.data import DataLoader, TensorDataset

# Load dataset
df = pd.read_csv("output_dataset.csv")

# Extract features (board state) and target (move_column)
X = df.drop(columns=["move_column"]).values  # Input features
y = df["move_column"].values                 # Target column (where to place piece)

# Convert to PyTorch tensors
X_tensor = torch.tensor(X, dtype=torch.float32)
y_tensor = torch.tensor(y, dtype=torch.long)  # Move column is a class label

# Create DataLoader for training
dataset = TensorDataset(X_tensor, y_tensor)
train_loader = DataLoader(dataset, batch_size=32, shuffle=True)

#-------------------------------------

class Connect5Net(nn.Module):
    def __init__(self):
        super(Connect5Net, self).__init__()
        self.fc1 = nn.Linear(42, 128)  # 42 board cells as input
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 7)  # 7 output neurons (one for each column)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

# Create model
model = Connect5Net()

# Loss function and optimizer
criterion = nn.CrossEntropyLoss()  # Classification loss
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training loop
epochs = 100
for epoch in range(epochs):
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

# Load trained model
model = Connect5Net()
model.load_state_dict(torch.load("connect5_model.pth"))
model.eval()  # Set model to inference mode

# Dummy input tensor for ONNX export (Ensure correct input size)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)  # Move model to GPU if available
dummy_input = torch.randn(1, 42, dtype=torch.float32).to(device)  # Ensure correct shape

# Export to ONNX format
onnx_filename = "connect5_model.onnx"
torch.onnx.export(
    model,
    dummy_input,
    onnx_filename,
    input_names=["input"],
    output_names=["output"],
    opset_version=11
)

print(f"✅ Model converted to ONNX: {onnx_filename}")