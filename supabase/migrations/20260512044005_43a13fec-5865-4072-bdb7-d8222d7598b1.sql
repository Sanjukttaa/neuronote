ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_folder_id_fkey;
ALTER TABLE public.files ADD CONSTRAINT files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_summaries_folder ON public.summaries(folder_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_folder ON public.flashcards(folder_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_folder ON public.quizzes(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON public.files(folder_id);