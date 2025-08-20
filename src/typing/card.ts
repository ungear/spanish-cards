export interface Card {
    id: number;
    word: string;
    translation: string;
    example: string;
    created_at: string;
    level: number;
    next_repeat: string;
    user_id: number;
}