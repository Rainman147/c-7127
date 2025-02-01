import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ChatService } from './chatService.ts';
import { MessageService } from './messageService.ts';
import { OpenAIService } from './openaiService.ts';
import { StreamHandler } from '../utils/streamHandler.ts';
import { createAppError } from '../utils/errorHandler.ts';

export class ServiceContainer {
  private static instance: ServiceContainer;
  
  public supabase;
  public chat: ChatService;
  public message: MessageService;
  public openai: OpenAIService;
  public stream: StreamHandler;

  private constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiKey: string
  ) {
    console.log('[ServiceContainer] Initializing services');
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.chat = new ChatService(supabaseUrl, supabaseKey);
    this.message = new MessageService(supabaseUrl, supabaseKey);
    this.openai = new OpenAIService(openaiKey);
    this.stream = new StreamHandler();
  }

  public static initialize(
    supabaseUrl?: string,
    supabaseKey?: string,
    openaiKey?: string
  ): ServiceContainer {
    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw createAppError(
        'Missing required configuration',
        'VALIDATION_ERROR'
      );
    }

    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer(
        supabaseUrl,
        supabaseKey,
        openaiKey
      );
    }

    return ServiceContainer.instance;
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      throw createAppError(
        'ServiceContainer not initialized',
        'VALIDATION_ERROR'
      );
    }
    return ServiceContainer.instance;
  }
}