import os
import json
import csv

input_directory = "../json" 
output_csv_file = "output_dataset.csv"

# Map player strings to numbers for the AI
player_map = {"p1": 1, "p2": -1, None: 0}

json_files = [f for f in os.listdir(input_directory) if f.endswith(".json")]

with open(output_csv_file, mode="w", newline="") as csv_file:
    writer = csv.writer(csv_file)
    header = [f"cell_{i}" for i in range(42)] + ["move_column"]
    writer.writerow(header)

    rows_written = 0
    for json_file in json_files:
        with open(os.path.join(input_directory, json_file), "r") as file:
            game_history = json.load(file) # This is a LIST of moves

            for turn in game_history:
                if isinstance(turn, dict) and "board" in turn:
                    # Convert p1/p2/null to 1/-1/0
                    board_flat = []
                    for row in turn["board"]:
                        for cell in row:
                            board_flat.append(player_map.get(cell, 0))
                    
                    # Add the move index as the target
                    board_flat.append(turn.get("move", 0))
                    
                    if len(board_flat) == 43: # 42 cells + 1 move
                        writer.writerow(board_flat)
                        rows_written += 1

print(f"✅ SUCCESS: Processed {len(json_files)} games and saved {rows_written} total moves to CSV.")