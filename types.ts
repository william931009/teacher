export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  audioBuffer?: AudioBuffer;
  image?: string; // Base64
}

export interface ExplanationStep {
  title: string;
  blackboardText: string; // The text written on the board (with LaTeX)
  spokenText: string;     // The script the teacher reads (more conversational)
  audioBuffer?: AudioBuffer; // Decoded audio for this step
}

export interface TutorState {
  isLoading: boolean;
  isPlaying: boolean;
  currentStepIndex: number;
  steps: ExplanationStep[];
  teacherImage?: string; // Base64 image of the generated teacher
}
