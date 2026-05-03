import { CheckForm } from '@/components/CheckForm';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-20 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
        <header className="text-center flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">AI Fact Checker</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Check news and statements with AI — multilingual fact-checking
          </p>
        </header>
        <CheckForm />
      </div>
    </main>
  );
}
