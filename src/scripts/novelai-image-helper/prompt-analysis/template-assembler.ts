import type { Settings } from '../settings/schema';
import { resolveActiveCharacters } from '../domain/binding';
import { getCurrentBindingContext } from '../platform/tavern/binding-context';
import { imageModelFamily, resolveSelectedTemplate } from './template-selection';

type AnalysisInput = {
  paragraphs: string[];
  history: string;
  worldbook: string;
};

type OrderedPrompts = NonNullable<GenerateRawConfig['ordered_prompts']>;

function characterGuidance(settings: Settings): string {
  const active = resolveActiveCharacters(settings.characters, getCurrentBindingContext());
  if (active.length === 0) return '(empty)';

  // JSON lines make free-form guidance unambiguous without requiring the model to copy it verbatim.
  return active
    .map(character => JSON.stringify({ name: character.name, guidance: character.content, avoid: character.negative }))
    .join('\n');
}

/**
 * Assemble the complete prompt-analysis conversation. Model-specific visual language lives in the
 * selected template, while this stable shell defines context boundaries and the output contract.
 */
export function assemblePromptAnalysisMessages(input: AnalysisInput, settings: Settings): OrderedPrompts {
  const family = imageModelFamily(settings.generation.model);
  return [
    {
      role: 'system',
      content: `You select useful illustration points in the latest story and write prompts for ${settings.generation.model}.

<model_prompt_rules family="${family}">
${resolveSelectedTemplate(settings)}
</model_prompt_rules>

Return exactly the requested JSON schema. The summary is a short selection rationale, never chain-of-thought.`,
    },
    {
      role: 'user',
      content: `<history reference_only="true">
${input.history || '(empty)'}
</history>

<worldbook reference_only="true">
${input.worldbook || '(empty)'}
</worldbook>

<character_guidance reference_only="true">
${characterGuidance(settings)}
</character_guidance>`,
    },
    {
      role: 'user',
      content: `<latest_story>
${input.paragraphs.map((paragraph, index) => `[P${index + 1}] ${paragraph}`).join('\n\n')}
</latest_story>`,
    },
  ];
}
