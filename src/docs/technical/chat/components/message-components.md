
# Message Components

## Core Message Components

### MessageContent
- Markdown processing with remarkGfm
- Custom styling for code blocks, links, tables
- Role-based styling (user vs assistant)
- Audio message indicators
- Edit status display

### Message Styling
1. User Messages
   ```css
   bg-gray-700/50
   rounded-[20px]
   px-4 py-2
   inline-block
   ```

2. Assistant Messages
   ```css
   prose prose-invert
   max-w-none
   space-y-6
   ```

## Rich Text Editing
- TiptapEditor integration with StarterKit
- Comprehensive toolbar
- Save/Cancel actions
- Edit state management
