import ast
import os
from pathlib import Path
import sys

SOURCE_DIRECTORIES = ("bin", "hooks", "src", "test")


def check_file(path, root):
    relative = path.relative_to(root)
    try:
        tree = ast.parse(path.read_bytes(), filename=str(relative))
    except SyntaxError as error:
        print(f"{relative}:{error.lineno or 1}:{error.offset or 1}: PY000 {error.msg}", file=sys.stderr)
        return 1

    issues = 0
    for node in ast.walk(tree):
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            message = "PY001 Catch a specific exception instead of using a bare except."
        elif isinstance(node, ast.ImportFrom) and any(alias.name == "*" for alias in node.names):
            message = "PY002 Import names explicitly instead of using a wildcard."
        else:
            continue
        print(f"{relative}:{node.lineno}:{node.col_offset + 1}: {message}", file=sys.stderr)
        issues += 1
    return issues


def source_files(root):
    for name in SOURCE_DIRECTORIES:
        directory = root / name
        if directory.is_symlink():
            continue
        for base, subdirectories, names in os.walk(directory):
            subdirectories[:] = [
                name for name in subdirectories
                if not name.startswith(".") and name not in ("node_modules", "venv")
            ]
            for name in names:
                path = Path(base) / name
                if path.suffix == ".py" and not path.is_symlink() and path.is_file():
                    yield path


def main():
    root = Path(os.environ["CHAOS_CHECKOUT"]).resolve(strict=True)
    files = sorted(source_files(root))
    issues = sum(check_file(path, root) for path in files)
    print(f"Python lint checked {len(files)} files and found {issues} issues.")
    return int(issues > 0)


if __name__ == "__main__":
    sys.exit(main())
