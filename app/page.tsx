'use client';

import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const samplePost = {
    id: '1',
    title: 'Introdução ao Blog Estático com Next.js e SQLite',
    excerpt:
      'Neste post, exploramos como construir um blog estático moderno usando Next.js, Tailwind CSS, e persistência de dados via SQLite. Aprenda sobre SSG, SSR, e otimização de performance.',
    date: '2024-01-15',
  };

  return (
    <main className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Bem-vindo ao Blog</h1>
          <p className="text-muted-foreground text-lg">
            Um blog de tecnologia moderno, profissional e pessoal.
          </p>
        </header>

        {/* Sample Post */}
        <Card className="border-border bg-card text-card-foreground shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>📅</span>
              <time dateTime={samplePost.date}>
                {new Date(samplePost.date).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>

            <h2 className="text-2xl font-semibold leading-none tracking-tight">
              {samplePost.title}
            </h2>

            <p className="text-muted-foreground text-sm leading-relaxed">
              {samplePost.excerpt}
            </p>

            <div className="pt-4 flex gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Ler mais
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-border bg-card text-card-foreground shadow-sm">
          <CardContent className="pt-6 space-y-2">
            <h3 className="text-lg font-semibold">Sobre este projeto</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Este blog está em desenvolvimento. Ele utiliza Next.js 14, Tailwind CSS,
              e persistência de dados via SQLite para um fluxo de trabalho moderno.
              O pipeline de build será automatizado via GitHub Actions para gerar HTML
              estático e publicar no GitHub Pages.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
