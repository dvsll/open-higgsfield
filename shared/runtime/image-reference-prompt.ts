/** Give short image instructions the reference-preservation context automatically. */
export function imageReferencePrompt(instruction: string): string {
  return [
    'Edit the supplied reference image according to the request below. Produce one coherent image.',
    'Use the first image as the base scene. Additional reference images identify the mentioned subjects or objects.',
    'Preserve the subjects\' identity, proportions, materials and colors, and the existing setting, lighting, camera angle and composition unless the request explicitly changes them.',
    'Change the pose and object interactions as needed to carry out the requested action naturally. Keep unrelated details unchanged. Do not add decorative objects or redesign the scene.',
    'The request takes priority over preservation wherever they conflict.',
    '',
    'Request: ' + instruction.trim(),
  ].join('\n');
}
