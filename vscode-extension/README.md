# SVG Outline & Badge

VSCode extension for the Lab 1 Phase 2 assignment.

## Effects

- Explorer files ending in `.svg` show a two-character `[]` badge. File names
  and contents are untouched; directories and non-SVG files get no badge.
- Opening an SVG text file enables the native **Outline** view. Elements are
  nested, labels are `tag#id` when an id exists and `tag` otherwise, and
  selecting a node jumps to the opening tag. Editing refreshes the outline;
  incomplete XML temporarily yields an empty outline instead of an error.

## Build and run

```powershell
npm.cmd install
npm.cmd run build
```

Then in VSCode: **Run and Debug → Extension** (or F5) with this folder as the
extension development path, and open `demo-workspace/`.

To run the extension against the demo folder from a terminal:

```powershell
code --extensionDevelopmentPath="$PWD" "$PWD/demo-workspace"
```

## Tests

```powershell
npm.cmd test
```

The tests cover nested groups, unnamed elements, source ranges, incomplete XML,
comments/declarations, and the `.svg` badge predicate.
