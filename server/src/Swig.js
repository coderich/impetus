import Swig from 'swig-templates';

export const terminal = new Swig.Swig({ autoescape: false });
export const telnet = new Swig.Swig({ autoescape: false });

terminal.setFilter('hit', input => `^r${input}^:`);
telnet.setFilter('hit', input => `<red>${input}<reset>`);

terminal.setFilter('miss', input => `^c${input}^:`);
telnet.setFilter('miss', input => `<SkyBlue>${input}<reset>`);

terminal.setFilter('error', input => `^r${input}^:`);
telnet.setFilter('error', input => `<red>${input}<reset>`);

terminal.setFilter('highlight', input => `^y${input}^:`);
telnet.setFilter('highlight', input => `<yellow>${input}<reset>`);

terminal.setFilter('roomNotice', input => `^c${input}^:`);
telnet.setFilter('roomNotice', input => `<SkyBlue>${input}<reset>`);

terminal.setFilter('roomTitle', input => `^C${input}^:`);
telnet.setFilter('roomTitle', input => `<cyan>${input}<reset>`);

terminal.setFilter('roomExits', input => `^g${input}^:`);
telnet.setFilter('roomExits', input => `<LimeGreen>${input}<reset>`);

terminal.setFilter('roomHere', input => `^m${input}^:`);
telnet.setFilter('roomHere', input => `<DarkOrchid>${input}<reset>`);

terminal.setFilter('creatureName', input => `^M${input}^:`);
telnet.setFilter('creatureName', input => `<magenta>${input}<reset>`);

terminal.setFilter('playerName', input => `^M${input}^:`);
telnet.setFilter('playerName', input => `<magenta>${input}<reset>`);

terminal.setFilter('dialog', input => `^g${input}^:`);
telnet.setFilter('dialog', input => `<LimeGreen>${input}<reset>`);
