import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import json  # If using JSON dataset

# Load dataset (Assuming JSON format)
def load_dataset(file_path):
    with open(file_path, "r") as file:
        data = json.load(file)
    return data

dataset = load_dataset("connect5_dataset.json")

# Convert dataset into input (X) and output (y)
X = []
y = []
for entry in dataset:
    X.append(entry["board_state"])
    y.append(entry["next_move"])  # AI should predict the best move

X = torch.tensor(X, dtype=torch.float32)  # Convert to tensor
y = torch.tensor(y, dtype=torch.long)  # Convert move to tensor
