import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { TemplateListItem } from "./TemplateListItem";
import type { Template } from "../types";

interface TemplateListProps {
  templates: Template[];
  onEdit: (template: { id: string; content: string }) => void;
  onDelete: (id: string) => void;
}

export const TemplateList = ({ templates, onEdit, onDelete }: TemplateListProps) => {
  return (
    <div className="space-y-2">
      {templates.map((template) => (
        <AlertDialog key={template.id}>
          <TemplateListItem
            template={template}
            onEdit={(id) => onEdit({
              id,
              content: template.content,
            })}
            onDelete={() => {}}
          />
          <AlertDialogContent className="menu-dialog">
            <AlertDialogHeader className="menu-dialog-header">
              <AlertDialogTitle className="menu-dialog-title">Delete Template</AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                Are you sure you want to delete this template? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="menu-dialog-content">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(template.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
};