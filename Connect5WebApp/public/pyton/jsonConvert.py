import os
import json
import csv

input_directory = "Oasis-GroupProject\Connect5WebApp\public\json"
output_csv_file = "output_dataset.csv"

# Get list of all JSON files in the directory
json_files = [f for f in os.listdir(input_directory) if f.endswith(".json")]

# Open CSV file for writing
with open(output_csv_file, mode="w", newline="") as csv_file:
    writer = csv.writer(csv_file)

    # Define header (column names)
    header = [f"cell_{r}_{c}" for r in range(7) for c in range(6)] + ["move"]
    writer.writerow(header)

    # Process each JSON file
    for json_file in json_files:
        json_path = os.path.join(input_directory, json_file)

        with open(json_path, "r") as file:
            data = json.load(file)

            # Extract board data and flatten it
            board_flattened = [cell for row in data["board"] for cell in row]
            board_flattened.append(data["move"])  # Add move column

            # Write data row to CSV
            writer.writerow(board_flattened)

print(f"CSV file '{output_csv_file}' generated successfully from {len(json_files)} JSON files.")