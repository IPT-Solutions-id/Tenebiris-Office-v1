type BuildSessionArgsOptions = {
  profile: string;
  sessionName: string;
  prompt: string;
  model?: string;
  skills?: string[];
};

export const buildSessionArgs = ({
  profile,
  sessionName,
  prompt,
  model,
  skills = [],
}: BuildSessionArgsOptions) => {
  const args = [
    '-p', profile,
    'chat', '-q', prompt, '-Q',
    '--continue', sessionName,
    '--create-if-missing',
    '--source', 'tenebiris-office',
  ];
  if (model) args.push('-m', model);
  if (skills.length) args.push('-s', skills.join(','));
  return args;
};

export const buildOneshotArgs = ({profile, prompt, model, skills = []}: Omit<BuildSessionArgsOptions, 'sessionName'>) => {
  const args = ['-p', profile, 'chat', '-q', prompt, '--oneshot', '-Q', '--source', 'tenebiris-office'];
  if (model) args.push('-m', model);
  if (skills.length) args.push('-s', skills.join(','));
  return args;
};
