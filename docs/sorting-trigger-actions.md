# Sorting Trigger Actions

The Trigger Actions Explorer provides two modes for managing execution order:

## Ordering Mode (Default)

- **Visual reordering** using up/down arrows
- **Automatic integer numbering** (1, 2, 3, etc.)
- **Overwrites existing order values** - may be problematic in package-based approaches

## Manual Mode

- **Direct number entry** with up to 4 decimal places
- **Preserves your entered values** (1.5, 2.25, 3.0)
- **Real-time reordering** as you enter values

## Usage

1. Click **"Edit Order"** in any action section
2. Toggle between modes using the **"Manual"** switch
3. Make your changes (arrows or number entry)
4. Click **"Save Order"** and confirm

## Important Note

**Ordering Mode overwrites existing order values** with sequential integers. This can cause issues in package-based deployments where order values are managed externally. Use **Manual Mode** to preserve specific order values.