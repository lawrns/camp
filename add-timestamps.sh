#!/bin/bash

echo "Adding withTimestamps to schemas..."
for file in db/schema/*.ts; do
    if [ -f "$file" ]; then
        # Check if file doesn't already have withTimestamps
        if ! grep -q "withTimestamps" "$file"; then
            echo "  - Processing $file..."
            # Add withTimestamps import if not present
            if ! grep -q "import.*withTimestamps" "$file"; then
                sed -i '' '1s/^/import { withTimestamps } from "..\/lib\/withTimestamps";\n/' "$file"
            fi
            # Add withTimestamps to pgTable definitions
            sed -i '' 's/export const \([^=]*\) = pgTable(\([^,]*\), {/export const \1 = pgTable(\2, {\n  ...withTimestamps,/' "$file"
        fi
    fi
done
echo "Done adding withTimestamps!"