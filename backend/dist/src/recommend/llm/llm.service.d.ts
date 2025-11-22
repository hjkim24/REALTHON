export declare class LLMService {
    private client;
    constructor();
    ask(prompt: string): Promise<string | null>;
}
