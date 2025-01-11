import { TemplateContext, DbTemplateContext } from '@/types/message';
import { parseSupabaseJson } from '@/types/utils';

export const transformTemplateContext = (dbContext: DbTemplateContext): TemplateContext => {
  console.log('[transformTemplateContext] Converting template context:', dbContext.id);
  
  return {
    id: dbContext.id,
    templateId: dbContext.template_id,
    chatId: dbContext.chat_id,
    messageId: dbContext.message_id,
    systemInstructions: dbContext.system_instructions,
    metadata: parseSupabaseJson(dbContext.metadata) || {},
    version: dbContext.version,
    createdAt: dbContext.created_at,
    updatedAt: dbContext.updated_at,
    userId: dbContext.user_id
  };
};

export const isTemplateContext = (context: any): context is TemplateContext => {
  return (
    context &&
    typeof context.templateId === 'string' &&
    typeof context.systemInstructions === 'string'
  );
};