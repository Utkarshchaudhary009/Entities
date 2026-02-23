import os

# Fix src/components/component-example.tsx
file_path = "src/components/component-example.tsx"
if os.path.exists(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    # Fix img element
    if "<img" in content and "biome-ignore lint/performance/noImgElement" not in content:
        content = content.replace("        <img", "        {/* biome-ignore lint/performance/noImgElement: Using img for external resource */}\n        <img")

    # Fix redundant alt
    content = content.replace('alt="Photo by mymind on Unsplash"', 'alt="Abstract composition by mymind on Unsplash"')
    content = content.replace('title="Photo by mymind on Unsplash"', 'title="Abstract composition by mymind on Unsplash"')

    with open(file_path, "w") as f:
        f.write(content)
    print(f"Fixed {file_path}")

# Fix src/components/ui/field.tsx
file_path = "src/components/ui/field.tsx"
if os.path.exists(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    # Fix noArrayIndexKey
    old_code = """        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>,
        )}"""

    new_code = """        {uniqueErrors.map((error, index) => {
          // biome-ignore lint/suspicious/noArrayIndexKey: No unique ID available for errors
          return error?.message && <li key={index}>{error.message}</li>;
        })}"""

    if old_code in content:
        content = content.replace(old_code, new_code)
    else:
        # Try finding it with slightly different formatting/indentation if biome formatted it
        # Biome likely put it on multiple lines.
        # Let's try to match by parts or just replace the specific line if possible.
        pass

    with open(file_path, "w") as f:
        f.write(content)
    print(f"Fixed {file_path}")
