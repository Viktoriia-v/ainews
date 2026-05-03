# Техническое задание: AI Fact-Checker

> **Назначение документа:** полная спецификация для реализации через Claude Code.
> Документ содержит все архитектурные решения, схемы данных, промпты, формулы и план реализации.

---

## 1. Описание проекта

### Цель
Веб-сайт для проверки новостей и утверждений с помощью AI. Пользователь вводит текст (новость или утверждение) — система ищет актуальные новости по теме, анализирует источники, сравнивает информацию между ними и выдаёт вердикт с обоснованием.

### Что видит пользователь на выходе
- **Вердикт:** `true` / `fake` / `partly_true` / `unclear` / `insufficient_data`
- **Процент уверенности:** 0–100%
- **Объяснение:** почему система пришла к такому выводу
- **Список всех источников:** с пометкой, на каких основан вывод
- **Краткое summary:** 2–3 предложения о том, что реально произошло
- **Противоречия:** если источники конфликтуют — это явно показывается

### Ключевые правила
- Если найдено мало источников или они низкого качества → вердикт `insufficient_data`
- Если источники противоречат друг другу → это явно отображается в результате
- Confidence считается **алгоритмически** по формуле, **не** через self-report от LLM

---

## 2. Технологический стек

| Слой | Технология |
|---|---|
| Фронтенд + бэкенд | **Next.js 14** (App Router, TypeScript) |
| Стилизация | **Tailwind CSS** + **shadcn/ui** |
| База данных | **PostgreSQL** (Railway plugin) |
| ORM | **Prisma** |
| LLM | **Anthropic Claude API** (модель: `claude-haiku-4-5-20251001`) |
| Поиск новостей | **Tavily Search API** |
| Fact-checking | **Google Fact Check Tools API** |
| Деплой | **Railway** |
| Менеджер пакетов | **pnpm** |

### Почему такой выбор
- **Next.js монолит:** API routes покрывают всю серверную логику, не нужен отдельный бэкенд
- **Tavily:** в отличие от обычных news API возвращает уже очищенный текст статьи, идеально для RAG-pipeline
- **Claude Haiku 4.5:** баланс цены и качества (~$0.005 за проверку), для structured output работает отлично
- **Prisma:** упрощает миграции и работу с БД

---

## 3. Структура проекта

```
fact-checker/
├── app/
│   ├── page.tsx                    # Главная: поле ввода + выбор языка
│   ├── check/[id]/page.tsx         # Страница результата (для шеринга)
│   ├── layout.tsx                  # Общий layout
│   ├── globals.css                 # Tailwind
│   └── api/
│       ├── check/route.ts          # POST: запуск проверки
│       └── result/[id]/route.ts    # GET: результат по ID
├── lib/
│   ├── pipeline/
│   │   ├── index.ts                # Главный orchestrator
│   │   ├── extractClaim.ts         # Шаг 1: извлечение утверждения
│   │   ├── searchNews.ts           # Шаг 2: Tavily search
│   │   ├── factCheckAPI.ts         # Шаг 3: Google Fact Check
│   │   ├── classifySources.ts      # Шаг 4: trusted/mainstream/unknown
│   │   ├── analyzeWithClaude.ts    # Шаг 5: анализ через Claude
│   │   └── computeConfidence.ts    # Шаг 6: расчёт % уверенности
│   ├── db/
│   │   └── client.ts               # Prisma client (singleton)
│   ├── sources/
│   │   ├── trusted.ts              # Whitelist trusted источников
│   │   └── ratings.ts              # Mapping домен → категория
│   ├── i18n/
│   │   ├── languages.ts            # 9 языков с метаданными
│   │   └── translations.ts         # UI-строки на 9 языках
│   ├── claude.ts                   # Anthropic SDK client
│   ├── tavily.ts                   # Tavily client
│   └── types.ts                    # Общие TypeScript типы
├── components/
│   ├── SearchInput.tsx             # Поле ввода + dropdown языков
│   ├── LanguageSelect.tsx          # Searchable dropdown (9 языков)
│   ├── ResultCard.tsx              # Главная карточка результата
│   ├── VerdictBadge.tsx            # Цветной бейдж вердикта
│   ├── ConfidenceBar.tsx           # Прогресс-бар уверенности
│   ├── SourceList.tsx              # Список источников (key + others)
│   ├── ShareButton.tsx             # Кнопка «Поделиться» (копирует URL)
│   ├── LoadingState.tsx            # Скелетон во время обработки
│   └── ui/                         # shadcn/ui компоненты
├── prisma/
│   └── schema.prisma               # Схема БД
├── public/
├── .env.local                      # API ключи (локально)
├── .env.example                    # Шаблон переменных
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## 4. Переменные окружения

`.env.example`:
```
# Database
DATABASE_URL="postgresql://user:pass@host:5432/factchecker"

# APIs
ANTHROPIC_API_KEY="sk-ant-..."
TAVILY_API_KEY="tvly-..."
GOOGLE_FACT_CHECK_API_KEY="AIza..."

# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

На Railway все эти переменные добавляются через UI проекта.

---

## 5. База данных (Prisma schema)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Check {
  id            String   @id @default(uuid())
  query         String   @db.Text
  language      String   // 'en' | 'uk' | 'ru' | 'lt' | 'pl' | 'fr' | 'de' | 'it' | 'es'
  
  // Результат
  verdict       String   // 'true' | 'fake' | 'partly_true' | 'unclear' | 'insufficient_data'
  confidence    Int      // 0-100
  summary       String   @db.Text
  explanation   String   @db.Text
  
  // Источники и метаданные
  sources       Json     // массив всех найденных источников
  keySources    Json     // ID источников, на которых основан вывод
  factCheckHits Json?    // совпадения из Google Fact Check
  contradictions Json?   // массив противоречий, если есть
  
  // Технические поля
  createdAt     DateTime @default(now())
  processingMs  Int      // сколько заняла обработка
  
  @@index([createdAt])
}
```

---

## 6. API endpoints

### `POST /api/check`
Запуск проверки утверждения.

**Request:**
```json
{
  "query": "Маск купил Twitter за 44 миллиарда",
  "language": "ru"
}
```

**Response:**
```json
{
  "id": "uuid-here",
  "verdict": "true",
  "confidence": 92,
  "summary": "...",
  "explanation": "...",
  "sources": [...],
  "keySourceIds": [...],
  "contradictions": [],
  "processingMs": 18432
}
```

**Логика:** синхронный вызов pipeline, ожидание 15–30 сек, сохранение в БД, возврат результата.

**Валидация:**
- `query`: 5–1000 символов
- `language`: один из 9 поддерживаемых кодов

**Rate limiting:** простой in-memory лимит 10 запросов в минуту с одного IP.

---

### `GET /api/result/[id]`
Получение готового результата по ID (для страницы шеринга).

**Response:** тот же формат что у POST.
**404:** если ID не найден.

---

## 7. Pipeline — детальное описание

Главный файл: `lib/pipeline/index.ts`

```typescript
export async function runPipeline(query: string, language: string) {
  const start = Date.now();
  
  // Шаг 1
  const claim = await extractClaim(query, language);
  
  // Шаги 2 и 3 — параллельно
  const [searchResults, factCheckResults] = await Promise.all([
    searchNews(claim, language),
    queryGoogleFactCheck(claim.english)
  ]);
  
  // Шаг 4
  const classifiedSources = classifySources(searchResults);
  
  // Если совсем мало источников — выходим раньше
  if (classifiedSources.usable.length < 2) {
    return buildInsufficientDataResult(claim, classifiedSources);
  }
  
  // Шаг 5
  const analysis = await analyzeWithClaude(claim, classifiedSources, factCheckResults);
  
  // Шаг 6
  const confidence = computeConfidence({
    sources: classifiedSources,
    agreementLevel: analysis.agreementLevel,
    factCheckHit: factCheckResults.length > 0
  });
  
  // Корректировка вердикта при низком confidence
  const finalVerdict = confidence < 30 ? 'insufficient_data' : analysis.verdict;
  
  return {
    claim,
    verdict: finalVerdict,
    confidence,
    summary: analysis.summary,
    explanation: analysis.explanation,
    sources: classifiedSources.all,
    keySourceIds: analysis.keySourceIds,
    contradictions: analysis.contradictions,
    factCheckHits: factCheckResults,
    processingMs: Date.now() - start
  };
}
```

### Шаг 1 — `extractClaim`
**Вход:** сырой ввод пользователя + язык
**Выход:**
```typescript
{
  original: string,        // утверждение на исходном языке (очищенное)
  english: string,         // перевод на английский
  entities: string[],      // ключевые сущности: имена, места, даты
  searchQueries: {
    native: string,        // поисковый запрос на исходном языке
    english: string        // поисковый запрос на английском
  }
}
```
Реализация: вызов Claude с промптом (см. раздел 8).

### Шаг 2 — `searchNews`
**Параллельные вызовы Tavily:**
1. `query = searchQueries.native` → региональные источники
2. `query = searchQueries.english` → международные источники

Параметры Tavily:
- `search_depth: "advanced"`
- `max_results: 8` на каждый запрос
- `include_raw_content: true`
- `topic: "news"`
- `days: 30` (свежесть)

Результат — массив объектов:
```typescript
{
  id: string,         // генерируем UUID
  url: string,
  title: string,
  content: string,    // очищенный текст
  domain: string,     // извлекаем из URL
  publishedDate: string,
  language: string    // native или english
}
```

Дедупликация по URL.

### Шаг 3 — `factCheckAPI`
Вызов `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=...&key=...`

Возвращает массив проверок от профессиональных fact-checkers (Snopes, PolitiFact, StopFake, AFP Fact Check и т.д.) если совпадение найдено.

Если ничего не найдено — возвращаем пустой массив (это нормально).

### Шаг 4 — `classifySources`
Для каждого источника из шага 2:
1. Извлекаем домен (без www)
2. Сверяем со whitelist в `lib/sources/trusted.ts`
3. Присваиваем категорию:
   - `trusted` — Reuters, AP, BBC и т.д. (вес 1.0)
   - `mainstream` — известные национальные СМИ (вес 0.6)
   - `unknown` — нет в списках, но не в чёрном (вес 0.2)
   - `unreliable` — известный источник дезинформации (отбрасываем)

**Выход:**
```typescript
{
  all: Source[],         // все источники с категориями
  usable: Source[],      // без unreliable
  trusted: Source[],
  mainstream: Source[],
  unknown: Source[]
}
```

### Шаг 5 — `analyzeWithClaude`
Передаём Claude:
- Исходное утверждение
- Все usable источники (текст + категория)
- Результаты Google Fact Check

Используем **Anthropic tool use (structured output)** — Claude обязан вернуть JSON в строгом формате (см. раздел 8).

### Шаг 6 — `computeConfidence`
Чистая функция, без LLM:

```typescript
export function computeConfidence(input: {
  sources: ClassifiedSources,
  agreementLevel: 'high' | 'medium' | 'low' | 'none',
  factCheckHit: boolean
}): number {
  const { trusted, mainstream, unknown, usable } = input.sources;
  const total = usable.length;
  
  if (total === 0) return 0;
  
  // 1. Качество источников (0..1)
  const sourceQuality = (
    trusted.length * 1.0 + 
    mainstream.length * 0.6 + 
    unknown.length * 0.2
  ) / total;
  
  // 2. Количество (насыщение на 5+)
  const sourceCount = Math.min(total / 5, 1);
  
  // 3. Согласие (0..1)
  const agreementMap = { high: 1.0, medium: 0.6, low: 0.3, none: 0 };
  const agreement = agreementMap[input.agreementLevel];
  
  // 4. Профессиональная проверка (0 или 1)
  const factCheck = input.factCheckHit ? 1 : 0;
  
  // Взвешенная сумма
  const score = (
    0.35 * sourceQuality + 
    0.25 * sourceCount + 
    0.25 * agreement + 
    0.15 * factCheck
  );
  
  return Math.round(score * 100);
}
```

**Эта формула описывается в дипломе как методология.** Веса можно подкручивать после ручного тестирования.

---

## 8. Промпты для Claude

### Промпт для `extractClaim`

**System:**
```
You are a claim extraction assistant for a fact-checking system. Your job is to take a user's input (which may be a question, news headline, statement, or rumor) and extract a clear, verifiable factual claim from it.

The user input may be in any of these languages: English, Ukrainian, Russian, Lithuanian, Polish, French, German, Italian, Spanish.

You must respond using the extract_claim tool.
```

**Tool definition:**
```typescript
{
  name: "extract_claim",
  description: "Extract a verifiable factual claim from user input",
  input_schema: {
    type: "object",
    properties: {
      original: {
        type: "string",
        description: "The cleaned claim in the original language, phrased as a clear factual statement"
      },
      english: {
        type: "string",
        description: "Accurate English translation of the claim"
      },
      entities: {
        type: "array",
        items: { type: "string" },
        description: "Key entities: names, places, organizations, dates, numbers"
      },
      searchQueries: {
        type: "object",
        properties: {
          native: {
            type: "string",
            description: "Optimized search query in original language (3-8 words, key terms only)"
          },
          english: {
            type: "string",
            description: "Optimized search query in English (3-8 words, key terms only)"
          }
        },
        required: ["native", "english"]
      }
    },
    required: ["original", "english", "entities", "searchQueries"]
  }
}
```

**User message:**
```
Language: {language_code}
User input: {raw_query}
```

---

### Промпт для `analyzeWithClaude`

**System:**
```
You are a fact-checking analyst. Given a claim and a set of news sources, your job is to determine whether the claim is supported, refuted, or unclear based on the evidence.

Rules:
1. Base your analysis ONLY on the provided sources. Do not use prior knowledge.
2. Trust ranking: "trusted" sources > "mainstream" > "unknown".
3. If sources contradict each other, document the contradictions explicitly.
4. If evidence is insufficient or conflicting, say so — do not guess.
5. Be neutral and avoid political bias.
6. Cite source IDs (not URLs) when referencing sources.

Verdict definitions:
- "true": the claim is clearly supported by multiple credible sources
- "fake": the claim is clearly refuted by credible sources
- "partly_true": some parts are supported, others refuted or exaggerated
- "unclear": evidence is mixed or sources conflict significantly
- "insufficient_data": not enough credible information to assess

You MUST respond using the analyze_claim tool.
```

**Tool definition:**
```typescript
{
  name: "analyze_claim",
  description: "Analyze a claim against the provided sources",
  input_schema: {
    type: "object",
    properties: {
      verdict: {
        type: "string",
        enum: ["true", "fake", "partly_true", "unclear", "insufficient_data"]
      },
      summary: {
        type: "string",
        description: "2-3 sentence neutral summary of what actually happened, in the user's original language"
      },
      explanation: {
        type: "string",
        description: "Why this verdict was reached, referencing specific sources by ID. In user's original language. 3-5 sentences."
      },
      keySourceIds: {
        type: "array",
        items: { type: "string" },
        description: "IDs of sources most directly supporting the verdict (typically 2-5)"
      },
      contradictions: {
        type: "array",
        items: { type: "string" },
        description: "List of significant contradictions between sources, if any. Empty array if none."
      },
      agreementLevel: {
        type: "string",
        enum: ["high", "medium", "low", "none"],
        description: "How much sources agree: high = all agree, medium = mostly agree, low = mixed, none = direct contradictions"
      }
    },
    required: ["verdict", "summary", "explanation", "keySourceIds", "contradictions", "agreementLevel"]
  }
}
```

**User message format:**
```
Claim (original): {claim.original}
Claim (English): {claim.english}
User language: {language}

Google Fact Check results:
{factCheckResults JSON or "No matches found"}

Sources ({sources.length} total):

[Source ID: src_001 | Category: trusted | Domain: reuters.com]
Title: ...
Published: ...
Content:
...

[Source ID: src_002 | Category: mainstream | Domain: ...]
...
```

---

## 9. Список trusted источников

Файл `lib/sources/trusted.ts`. Структура:

```typescript
export type SourceCategory = 'trusted' | 'mainstream' | 'unknown' | 'unreliable';

export const SOURCE_RATINGS: Record<string, SourceCategory> = {
  // === TRUSTED (international, high standards) ===
  'reuters.com': 'trusted',
  'apnews.com': 'trusted',
  'bbc.com': 'trusted',
  'bbc.co.uk': 'trusted',
  'afp.com': 'trusted',
  'bloomberg.com': 'trusted',
  'ft.com': 'trusted',
  'economist.com': 'trusted',
  'nytimes.com': 'trusted',
  'washingtonpost.com': 'trusted',
  'theguardian.com': 'trusted',
  'wsj.com': 'trusted',
  'npr.org': 'trusted',
  'pbs.org': 'trusted',
  'bellingcat.com': 'trusted',
  
  // === EN MAINSTREAM ===
  'cnn.com': 'mainstream',
  'cbsnews.com': 'mainstream',
  'nbcnews.com': 'mainstream',
  'abcnews.go.com': 'mainstream',
  'usatoday.com': 'mainstream',
  'politico.com': 'mainstream',
  'axios.com': 'mainstream',
  'theatlantic.com': 'mainstream',
  
  // === UK (Ukrainian) ===
  'suspilne.media': 'trusted',
  'pravda.com.ua': 'trusted',
  'radiosvoboda.org': 'trusted',
  'hromadske.ua': 'trusted',
  'bbc.com/ukrainian': 'trusted',
  'liga.net': 'mainstream',
  'nv.ua': 'mainstream',
  'censor.net': 'mainstream',
  'ukrinform.ua': 'mainstream',
  'unian.ua': 'mainstream',
  'gordonua.com': 'mainstream',
  'lb.ua': 'mainstream',
  'epravda.com.ua': 'mainstream',
  'kyivindependent.com': 'trusted',
  
  // === RU (Russian, independent) ===
  'meduza.io': 'trusted',
  'novayagazeta.eu': 'trusted',
  'svoboda.org': 'trusted',
  'bbc.com/russian': 'trusted',
  'currenttime.tv': 'trusted',
  'theins.ru': 'mainstream',
  'republic.ru': 'mainstream',
  
  // === LT (Lithuanian) ===
  'lrt.lt': 'trusted',
  'delfi.lt': 'mainstream',
  '15min.lt': 'mainstream',
  'bns.lt': 'mainstream',
  'lrytas.lt': 'mainstream',
  
  // === PL (Polish) ===
  'tvn24.pl': 'trusted',
  'wyborcza.pl': 'trusted',
  'rp.pl': 'trusted',
  'onet.pl': 'mainstream',
  'wp.pl': 'mainstream',
  'polsatnews.pl': 'mainstream',
  'polskieradio.pl': 'trusted',
  'notesfrompoland.com': 'mainstream',
  
  // === FR (French) ===
  'lemonde.fr': 'trusted',
  'liberation.fr': 'trusted',
  'lefigaro.fr': 'mainstream',
  'france24.com': 'trusted',
  'rfi.fr': 'trusted',
  'francetvinfo.fr': 'mainstream',
  'lesechos.fr': 'mainstream',
  
  // === DE (German) ===
  'dw.com': 'trusted',
  'spiegel.de': 'trusted',
  'sueddeutsche.de': 'trusted',
  'faz.net': 'trusted',
  'zeit.de': 'trusted',
  'tagesschau.de': 'trusted',
  'welt.de': 'mainstream',
  
  // === IT (Italian) ===
  'ansa.it': 'trusted',
  'repubblica.it': 'mainstream',
  'corriere.it': 'mainstream',
  'rainews.it': 'trusted',
  'ilsole24ore.com': 'mainstream',
  'lastampa.it': 'mainstream',
  
  // === ES (Spanish) ===
  'elpais.com': 'trusted',
  'efe.com': 'trusted',
  'rtve.es': 'trusted',
  'elmundo.es': 'mainstream',
  'abc.es': 'mainstream',
  'lavanguardia.com': 'mainstream',
  
  // === UNRELIABLE (drop from results) ===
  'rt.com': 'unreliable',
  'sputniknews.com': 'unreliable',
  'tass.ru': 'unreliable',
  'tass.com': 'unreliable',
  'pravda.ru': 'unreliable',
  'globalresearch.ca': 'unreliable',
  'zerohedge.com': 'unreliable',
  'infowars.com': 'unreliable',
  'naturalnews.com': 'unreliable',
  'beforeitsnews.com': 'unreliable',
};

export function classifyDomain(domain: string): SourceCategory {
  const cleaned = domain.replace(/^www\./, '').toLowerCase();
  return SOURCE_RATINGS[cleaned] || 'unknown';
}
```

> Список можно расширять по мере тестирования. В дипломе обязательно описать методологию выбора (опора на Media Bias/Fact Check, NewsGuard, рейтинги Reporters Without Borders).

---

## 10. Языки и i18n

### `lib/i18n/languages.ts`
```typescript
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];
```

### `lib/i18n/translations.ts`
Объект `translations[lang][key]` со всеми UI-строками. Минимальный набор ключей:
- `app.title` — "AI Fact Checker"
- `app.subtitle` — "Check news and statements with AI"
- `input.placeholder` — "Enter a news headline or statement to verify..."
- `input.submit` — "Check"
- `input.languageLabel` — "Language of the claim"
- `loading.searching` — "Searching news sources..."
- `loading.analyzing` — "Analyzing sources..."
- `loading.computing` — "Computing verdict..."
- `verdict.true` — "True"
- `verdict.fake` — "Fake"
- `verdict.partly_true` — "Partly true"
- `verdict.unclear` — "Unclear"
- `verdict.insufficient_data` — "Not enough data"
- `result.confidence` — "Confidence"
- `result.summary` — "Summary"
- `result.explanation` — "Explanation"
- `result.keySources` — "Key sources"
- `result.allSources` — "All sources"
- `result.contradictions` — "Contradictions found"
- `result.share` — "Share"
- `result.shareCopied` — "Link copied!"
- `error.generic` — "Something went wrong. Please try again."
- `error.tooShort` — "Please enter at least 5 characters"
- `error.rateLimit` — "Too many requests. Please wait a minute."

UI-язык **отдельный** от языка проверяемого утверждения. По умолчанию UI на английском (можно переключить позже — для диплома хватит англ. UI).

---

## 11. UI / UX требования

### Главная страница (`/`)
**Layout:**
- Центрированный контент, max-width ~600px
- Заголовок проекта вверху
- Большое поле ввода (textarea, 3–5 строк) с placeholder
- Под полем — searchable dropdown для выбора языка (default: English)
- Кнопка "Check" под полем
- Минималистичный современный дизайн

### Состояние загрузки
- Skeleton-карточка вместо результата
- Анимированный текст с этапами: "Searching news sources..." → "Analyzing sources..." → "Computing verdict..."
- Стадии переключаются примерно каждые 5–8 секунд

### Карточка результата
1. **Verdict badge** — крупный, цветной:
   - `true` → зелёный
   - `fake` → красный
   - `partly_true` → жёлтый
   - `unclear` → серый
   - `insufficient_data` → серый с иконкой ⚠️
2. **Confidence bar** — прогресс-бар с числом, цвет матчит вердикт
3. **Summary** — короткий блок с фактами
4. **Explanation** — обоснование вердикта
5. **Contradictions** (если есть) — отдельный блок с предупреждением
6. **Key sources** — карточки источников, использованных для вывода (домен, заголовок, дата, бейдж категории, ссылка)
7. **All sources** — collapsible список всех найденных
8. **Share button** — копирует ссылку `/check/[id]` в буфер обмена

### Страница `/check/[id]`
- Тот же layout что у результата на главной
- Сверху показан исходный query пользователя
- Open Graph мета-теги для красивых превью при шеринге в соцсетях

---

## 12. Шеринг

Реализация:
1. После успешной проверки в БД создаётся запись с UUID
2. Кнопка "Share" копирует `${BASE_URL}/check/${id}` в clipboard
3. Страница `/check/[id]` рендерит результат через `GET /api/result/[id]`
4. Open Graph теги:
   - `og:title` = первые 60 символов query
   - `og:description` = summary
   - `og:image` = опционально, можно добавить динамическую картинку через Vercel OG (или пропустить для MVP)

---

## 13. Edge cases и обработка ошибок

| Ситуация | Поведение |
|---|---|
| Tavily вернул 0 результатов | Вердикт `insufficient_data`, объяснение "No relevant news found" |
| Все источники из категории `unknown` | Confidence снижается, в explanation отмечается низкое качество источников |
| Сильные противоречия между trusted источниками | Вердикт `unclear`, contradictions заполнен |
| Claude вернул невалидный JSON | Retry до 2 раз, потом ошибка `error.generic` |
| Таймаут API (>60 сек) | Возврат ошибки, запись в БД не создаётся |
| Confidence < 30% | Вердикт принудительно `insufficient_data` |
| Использовано <2 usable источников | Вердикт принудительно `insufficient_data` |
| Запрос на нелатинском языке без подходящих источников | Поиск дополнительно дублируется на английском |

---

## 14. Деплой на Railway

### Шаги настройки
1. Создать новый проект на Railway
2. Добавить PostgreSQL plugin (генерируется `DATABASE_URL`)
3. Подключить GitHub-репозиторий
4. В Variables добавить:
   - `ANTHROPIC_API_KEY`
   - `TAVILY_API_KEY`
   - `GOOGLE_FACT_CHECK_API_KEY`
   - `NEXT_PUBLIC_BASE_URL` (присвоить публичный домен Railway)
5. Build command: `pnpm install && pnpm prisma generate && pnpm prisma migrate deploy && pnpm build`
6. Start command: `pnpm start`

### `package.json` scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio"
  }
}
```

---

## 15. План разработки по неделям

### Неделя 1 (5–11 мая) — фундамент
- [ ] Получить все API ключи (Anthropic, Tavily, Google Fact Check)
- [ ] Создать Next.js проект с TypeScript + Tailwind + shadcn/ui
- [ ] Настроить Prisma + PostgreSQL (локально через Docker, потом Railway)
- [ ] Реализовать `extractClaim` (Claude tool use)
- [ ] Реализовать `searchNews` (Tavily integration)
- [ ] Реализовать `factCheckAPI` (Google Fact Check)
- [ ] Реализовать `classifySources` + базовый whitelist
- [ ] Реализовать `analyzeWithClaude` (Claude tool use)
- [ ] Реализовать `computeConfidence`
- [ ] Главный `runPipeline` orchestrator
- [ ] Грубый UI: input + кнопка + JSON-вывод результата
- [ ] Первая работающая end-to-end проверка

### Неделя 2 (12–18 мая) — продукт
- [ ] Полноценный UI: ResultCard, VerdictBadge, ConfidenceBar, SourceList
- [ ] Loading state с переключающимися этапами
- [ ] LanguageSelect (searchable dropdown с 9 языками)
- [ ] Страница `/check/[id]`
- [ ] Кнопка Share
- [ ] Обработка edge cases (insufficient_data, противоречия)
- [ ] Расширение whitelist (минимум 80 доменов)
- [ ] i18n строки (англ. UI достаточно)
- [ ] Rate limiting

### Неделя 3 (19–25 мая) — тестирование
- [ ] Деплой на Railway, проверка production
- [ ] Open Graph теги
- [ ] Ручное тестирование на 50 кейсах: исторически известные правда/фейк/спорные. Записать результаты в таблицу для диплома
- [ ] Подкрутить веса в формуле confidence по итогам тестов
- [ ] Подкрутить промпты по итогам тестов
- [ ] Полировка UI: анимации, mobile responsive
- [ ] Логирование (минимум — console.log с timestamp на каждом шаге pipeline)

### Неделя 4 (26–31 мая) — финиш
- [ ] Финальный QA на production
- [ ] Багфиксы
- [ ] Написание текста диплома: архитектура, методология, формула, результаты тестирования
- [ ] Скриншоты и схемы для презентации
- [ ] README для репозитория

---

## 16. Что важно для защиты диплома

1. **Прозрачная методология confidence** — формула из 4 факторов с явными весами. Это главный академический козырь.
2. **Whitelist trusted источников** — описать критерии выбора (Media Bias/Fact Check, NewsGuard, RSF).
3. **Таблица результатов тестирования** — 30–50 утверждений с известным ground truth (известные фейки vs известные факты). Метрики: accuracy, precision, recall по каждому вердикту.
4. **Архитектурная схема pipeline** — диаграмма из 6 шагов для презентации.
5. **Сравнение подходов** — упомянуть, почему выбран lite-RAG, а не векторный, почему гибрид с Google Fact Check, почему alg confidence, а не self-reported.
6. **Multilingual support** — 9 языков с локальными источниками — серьёзная фича, выделяет проект на фоне типичных дипломных fact-checker'ов.

---

## 17. Бюджет API (оценка)

| Ресурс | Стоимость |
|---|---|
| Claude Haiku 4.5 (~500 проверок) | ~$2.50 |
| Tavily (free tier 1000/мес) | $0 |
| Google Fact Check API | $0 |
| Railway (уже оплачен) | $0 |
| **Итого на разработку и демо** | **<$10** |

---

## 18. Команды для старта (Claude Code)

```bash
# 1. Создание проекта
pnpm create next-app@latest fact-checker --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd fact-checker

# 2. Установка зависимостей
pnpm add @anthropic-ai/sdk @prisma/client @tavily/core
pnpm add -D prisma

# 3. shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card badge progress textarea command popover skeleton

# 4. Prisma init
pnpm prisma init

# 5. После создания schema.prisma:
pnpm prisma migrate dev --name init
pnpm prisma generate

# 6. Запуск
pnpm dev
```

---

## Приоритет реализации для Claude Code

При работе по этому ТЗ начать с **Шага 1 в плане Недели 1** (создание Next.js проекта) и идти строго по чек-листу. На каждый шаг — отдельный коммит. Не переходить к UI пока не работает pipeline на API уровне (можно тестировать через curl или Postman).
