export const jsonOutputInstruction = (jsonSchema: string) => `\
<output_format>
Debes responder ÚNICAMENTE con un JSON que cumpla ESTRICTAMENTE con este JSON Schema:
${jsonSchema}
</output_format>
`
