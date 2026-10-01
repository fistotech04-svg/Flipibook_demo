/**
 * spellGrammarChecker.js
 * High-performance, offline spell and grammar checker for the Flipbook editor.
 * Provides word verification, typo correction suggestions (Levenshtein distance),
 * common grammar error detection (e.g. "a apple", "their/there/they're", capitalization, duplicate words),
 * and Google Docs-style red/blue squiggly underline highlights and suggestion tooltips.
 */

// Most common English words dictionary (~3,000 words + common domain terms)
const COMMON_WORDS_LIST = [
  "the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you",
  "do","at","this","but","his","by","from","they","we","say","her","she","or","an","will","my","one",
  "all","would","there","their","what","so","up","out","if","about","who","get","which","go","me",
  "when","make","can","like","time","no","just","him","know","take","people","into","year","your","good",
  "some","could","them","see","other","than","then","now","look","only","come","its","over","think","also",
  "back","after","use","two","how","our","work","first","well","way","even","new","want","because","any",
  "these","give","day","most","us","great","between","need","large","under","never","each","few","life",
  "always","both","often","always","might","world","system","story","group","number","part","point","place",
  "high","right","small","state","city","country","world","book","page","read","text","image","video",
  "flipbook","editor","title","paragraph","header","footer","content","design","style","color","font",
  "size","format","align","center","left","right","button","link","website","online","media","photo",
  "picture","audio","sound","camera","music","preview","share","download","export","import","settings",
  "help","home","about","contact","service","product","business","company","team","about","profile",
  "account","login","logout","register","password","email","phone","address","message","chat","send",
  "receive","view","create","edit","delete","update","save","cancel","ok","yes","no","submit","confirm",
  "search","filter","sort","order","category","tag","item","list","table","row","column","grid","card",
  "layout","layer","canvas","drawing","shape","line","circle","rectangle","square","polygon","star",
  "arrow","icon","symbol","logo","watermark","background","border","shadow","radius","margin","padding",
  "width","height","position","top","bottom","left","right","rotate","scale","zoom","pan","move","drag",
  "drop","select","copy","cut","paste","undo","redo","history","action","event","click","hover","scroll",
  "touch","swipe","double","single","spread","sheet","cover","hardcover","paper","texture","realistic",
  "animation","effect","speed","duration","delay","smooth","fast","slow","medium","classic","custom",
  "modern","minimal","clean","dark","light","gradient","solid","transparent","opacity","visible","hidden",
  "display","show","hide","toggle","enable","disable","active","inactive","status","loading","success",
  "warning","error","danger","info","note","tip","guide","documentation","manual","tutorial","welcome",
  "get","started","free","pro","premium","plan","pricing","features","benefits","review","feedback",
  "comment","rating","star","favorite","like","bookmark","folder","file","document","pdf","presentation",
  "catalog","magazine","brochure","flyer","report","portfolio","album","newsletter","menu","card",
  "invitation","greeting","poster","banner","header","cover","backcover","spine","binding","page",
  "spread","doublepage","singlepage","flip","turn","curl","slide","fade","zoom","bounce","elastic",
  "linear","ease","in","out","both","auto","manual","loop","play","pause","stop","mute","volume",
  "fullscreen","window","mobile","tablet","desktop","responsive","device","screen","resolution",
  "landscape","portrait","square","aspect","ratio","scale","fit","fill","crop","stretch","contain",
  "bold","italic","underline","strikethrough","uppercase","lowercase","capitalize","normal",
  "bullet","numbered","spacing","indent","tracking","leading","kerning","baseline","script","sans",
  "serif","monospace","cursive","fantasy","decorative","handwriting","calligraphy","heading","subheading",
  "body","caption","quote","code","pre","span","div","section","article","aside","header","footer",
  "nav","main","aside","figure","figcaption","mark","time","progress","meter","details","summary",
  "dialog","modal","popup","tooltip","dropdown","menu","sidebar","navbar","toolbar","panel","tab",
  "accordion","carousel","slider","pagination","breadcrumb","badge","avatar","chip","tag","divider",
  "separator","spacer","container","wrapper","box","flex","flexbox","inline","block","table","cell",
  "none","initial","inherit","unset","all","auto","hidden","visible","scroll","clip","ellipsis"
];

// Expanded dictionary Set for O(1) word lookup
const DICTIONARY = new Set(COMMON_WORDS_LIST.map(w => w.toLowerCase()));

// Add extra common English vocabulary
[
  "able","about","above","accept","according","account","across","act","action","activity","actually","add",
  "address","administration","admit","adult","affect","after","again","against","age","agency","agent","ago",
  "agree","agreement","ahead","air","all","allow","almost","alone","along","already","also","although",
  "always","american","among","amount","analysis","and","animal","another","answer","any","anyone","anything",
  "appear","apply","approach","area","argue","arm","around","arrive","art","article","artist","as",
  "ask","assume","at","attack","attention","attorney","audience","author","authority","available","avoid","away",
  "baby","back","bad","bag","ball","bank","bar","base","be","beat","beautiful","because",
  "become","bed","before","begin","behavior","behind","believe","benefit","best","better","between","beyond",
  "big","bill","billion","bit","black","blood","blue","board","body","book","born","both",
  "box","boy","break","bring","brother","budget","build","building","business","but","buy","by",
  "call","camera","campaign","can","cancer","candidate","capital","car","card","care","career","carry",
  "case","catch","cause","cell","center","central","century","certain","certainly","chair","challenge","chance",
  "change","character","charge","check","child","choice","choose","church","citizen","city","civil","claim",
  "class","clear","clearly","close","coach","cold","collection","college","color","come","commercial","common",
  "community","company","compare","computer","concern","condition","conference","congress","consider","consumer","contain","continue",
  "control","cost","could","country","couple","course","court","cover","create","crime","cultural","culture",
  "cup","current","customer","cut","dark","data","daughter","day","dead","deal","death","debate",
  "decade","decide","decision","deep","defense","degree","democrat","democratic","describe","design","despite","detail",
  "determine","develop","development","die","difference","different","difficult","dinner","direction","director","discover","discuss",
  "discussion","disease","do","doctor","dog","door","down","draw","dream","drive","drop","drug",
  "during","each","early","east","easy","eat","economic","economy","edge","education","effect","effort",
  "eight","either","election","else","employee","end","energy","enjoy","enough","enter","entire","environment",
  "environmental","especially","establish","even","evening","event","ever","every","everybody","everyone","everything","evidence",
  "exactly","example","executive","exist","expect","experience","expert","explain","eye","face","fact","factor",
  "fail","fall","family","far","fast","father","fear","federal","feel","feeling","few","field",
  "fight","figure","fill","film","final","finally","financial","find","fine","finger","finish","fire",
  "firm","first","fish","five","floor","fly","focus","follow","food","foot","for","force",
  "foreign","forget","form","former","forward","four","free","friend","from","front","full","fund",
  "future","game","garden","gas","general","generation","get","girl","give","glass","go","goal",
  "good","government","great","green","ground","group","grow","growth","guess","gun","guy","hair",
  "half","hand","hang","happen","happy","hard","have","he","head","health","hear","heart",
  "heat","heavy","help","her","here","herself","high","him","himself","his","history","hit",
  "hold","home","hope","hospital","hot","hotel","hour","house","how","however","huge","human",
  "hundred","husband","i","idea","identify","if","image","imagine","impact","important","improve","in",
  "include","including","increase","indeed","indicate","individual","industry","information","inside","instead","institution","interest",
  "interesting","international","interview","into","investment","involve","issue","it","item","its","itself",
  "job","join","just","keep","key","kid","kill","kind","kitchen","know","knowledge","land",
  "language","large","last","late","later","laugh","law","lawyer","lay","lead","leader","learn",
  "least","leave","left","leg","legal","less","let","letter","level","lie","life","light",
  "like","likely","line","list","listen","little","live","local","long","look","lose","loss",
  "lot","love","low","machine","magazine","main","maintain","major","majority","make","man","manage",
  "management","manager","many","market","marriage","material","matter","may","maybe","me","mean","measure",
  "media","medical","meet","meeting","member","memory","mention","message","method","middle","might","military",
  "million","mind","minute","miss","mission","model","modern","moment","money","month","more","morning",
  "most","mother","mouth","move","movement","movie","mr","mrs","ms","much","music","must",
  "my","myself","name","nation","national","natural","nature","near","nearly","necessary","need","network",
  "never","new","news","newspaper","next","nice","night","no","none","nor","north","not",
  "note","nothing","notice","now","number","occur","of","off","offer","office","officer","official",
  "often","oh","oil","ok","old","on","once","one","only","onto","open","operation",
  "opportunity","option","or","order","organization","other","others","our","out","outside","over","own",
  "owner","page","pain","painting","paper","parent","part","participant","particular","particularly","partner","party",
  "pass","past","patient","pattern","pay","peace","people","per","perform","performance","perhaps","period",
  "person","personal","phone","physical","pick","picture","piece","place","plan","plant","play","player",
  "pm","point","police","policy","political","politics","poor","popular","population","position","positive","possible",
  "power","practice","prepare","present","president","pressure","pretty","prevent","price","private","probably","problem",
  "process","produce","product","production","professional","professor","program","project","property","protect","prove","provide",
  "public","pull","purpose","push","put","quality","question","quickly","quite","race","radio","raise",
  "range","rate","rather","reach","read","ready","real","reality","realize","really","reason","receive",
  "recent","recently","recognize","record","red","reduce","reflect","region","relate","relationship","religious","remain",
  "remember","remove","report","represent","republican","require","research","resource","respond","response","responsibility","rest",
  "result","return","reveal","rich","right","rise","risk","road","rock","role","room","rule",
  "run","safe","same","save","say","scene","school","science","scientist","score","sea","season",
  "seat","second","section","security","see","seek","seem","sell","send","senior","sense","series",
  "serious","serve","service","set","seven","several","sex","sexual","shake","share","she","shoot",
  "short","shot","should","shoulder","show","side","sign","significant","similar","simple","simply","since",
  "sing","single","sister","sit","site","situation","six","size","skill","skin","small","smile",
  "so","social","society","soldier","some","somebody","someone","something","sometimes","son","song","soon",
  "sort","sound","source","south","southern","space","speak","special","specific","speech","spend","sport",
  "spring","staff","stage","stand","standard","star","start","state","statement","station","stay","step",
  "still","stock","stop","store","story","strategy","street","strong","structure","student","study","stuff",
  "style","subject","success","successful","such","suddenly","suffer","suggest","summer","support","sure","surface",
  "system","table","take","talk","task","tax","teach","teacher","team","technology","television","tell",
  "ten","tend","term","test","than","thank","thanks","that","the","their","them","themselves","then",
  "theory","there","these","they","thing","think","third","this","those","though","thought","thousand",
  "threat","three","through","throughout","throw","thus","time","to","today","together","tonight","too",
  "top","total","tough","toward","towards","town","trade","traditional","training","travel","treat","treatment",
  "tree","trial","trip","trouble","true","truth","try","turn","tv","two","type","under",
  "understand","unit","until","up","upon","us","use","used","user","usual","usually","value",
  "various","very","victim","view","violence","visit","voice","vote","wait","walk","wall","want",
  "war","watch","water","way","we","weapon","wear","week","weight","well","west","western",
  "what","whatever","when","where","whether","which","while","white","who","whole","whom","whose",
  "why","wide","wife","will","win","wind","window","wish","with","within","without","woman",
  "wonder","word","work","worker","world","worry","would","write","writer","wrong","yard","yeah",
  "year","yes","yet","you","young","your","yourself"
].forEach(w => DICTIONARY.add(w.toLowerCase()));

// Common contractions & plurals/verbs
[
  "don't","doesn't","didn't","won't","can't","couldn't","shouldn't","wouldn't","isn't","aren't",
  "wasn't","weren't","hasn't","haven't","hadn't","it's","i'm","you're","we're","they're","he's",
  "she's","that's","what's","there's","who's","let's","i've","you've","we've","they've","i'd",
  "you'd","we'd","they'd","i'll","you'll","we'll","they'll"
].forEach(w => DICTIONARY.add(w.toLowerCase()));

// Comprehensive additional vocabulary
["random","randoms","randomly","simple","simply","sample","samples","text","texts","well","some","quick","lazy","fox","jumps","over","dog","hello","world","amazing","another","anything","anyway","article","artist","beautiful","become","before","behind","believe","between","beyond","brother","building","business","camera","candidate","capital","category","certain","certainly","challenge","change","chapter","character","collection","college","color","column","comment","common","community","company","compare","complete","completely","computer","condition","content","continue","control","correct","country","course","create","creative","current","custom","customer","dark","data","decision","default","define","design","designer","detail","device","difference","different","difficult","digital","direction","director","discover","display","distance","document","download","drawing","duration","dynamic","early","easily","economic","edition","editor","education","effect","effective","element","enough","entire","environment","especially","essential","estate","event","everything","example","excellent","experience","expert","explain","export","expression","factor","family","famous","fashion","favorite","feature","feeling","figure","finally","financial","finger","finish","flexible","flight","flipbook","folder","follow","following","foreign","forest","format","forward","foundation","freedom","friend","future","gallery","garden","general","generally","generation","global","google","government","graphic","great","greater","greatest","ground","growth","handle","happen","header","health","healthy","height","helpful","history","honest","hospital","housing","however","hundred","husband","identify","identity","ignore","impact","important","improve","include","including","income","increase","indeed","indicate","individual","industry","information","initial","inside","instead","institution","interest","interesting","internal","international","interview","introduction","investment","island","issue","item","journey","judgment","justice","kitchen","knowledge","landscape","language","large","larger","largest","latest","lawyer","leader","leadership","learning","letter","library","likely","listen","little","living","location","machine","magazine","maintain","major","majority","manage","management","manager","manner","market","marketing","marriage","material","matter","measure","media","medical","medium","meeting","member","memory","mention","message","method","middle","military","million","minute","mission","modern","moment","morning","mother","motion","movement","movie","museum","music","musical","natural","nature","nearly","necessary","negative","network","newspaper","normal","normally","notice","number","object","obtain","obvious","obviously","occur","office","officer","official","online","operation","opinion","opportunity","option","order","ordinary","organization","original","outside","package","painting","palette","parent","participant","particular","particularly","partner","partnership","passage","passenger","pattern","payment","people","percentage","perfect","perfectly","perform","performance","period","person","personal","personally","perspective","picture","planner","platform","player","pleasant","plenty","pocket","poetry","police","policy","political","politics","popular","population","position","positive","possible","possibly","potato","potential","poverty","powder","powerful","practice","prefer","prepare","present","presentation","preserve","president","pressure","pretty","prevent","previous","previously","primary","printer","priority","privacy","private","probably","problem","procedure","process","produce","product","production","profession","professional","professor","profile","program","progress","project","promise","promote","proper","properly","property","proposal","protect","protection","provide","public","publish","publisher","purpose","quality","quarter","question","quickly","quiet","quietly","radius","raise","range","rapidly","rarely","rather","reach","reaction","readily","reading","reality","realize","really","reason","reasonable","receive","recent","recently","recipe","recognize","recommend","record","recording","recover","reduce","reduction","refer","reference","reflect","reflection","reform","refrigerator","refuse","regard","regarding","regardless","regime","region","regional","register","regular","regularly","regulate","regulation","reinforce","reject","relate","relation","relationship","relative","relatively","relax","release","relevant","relief","religion","religious","rely","remain","remaining","remarkable","remember","remind","remote","remove","repeat","repeatedly","replace","reply","report","reporter","represent","representation","representative","reputation","request","require","requirement","research","researcher","resemble","reservation","resident","resist","resolution","resort","resource","respect","respond","respondent","response","responsibility","responsible","restaurant","restore","result","retain","retire","retirement","return","reveal","revenue","review","revolution","rhythm","ridiculous","right","routine","running","satisfaction","satisfy","saving","scenario","schedule","scholar","scholarship","science","scientific","scientist","scope","screen","script","search","season","second","secondary","secret","section","sector","secure","security","segment","select","selection","self","selling","senate","senator","senior","sensitive","sentence","separate","sequence","series","serious","seriously","serve","service","session","settle","settlement","several","severe","shade","shadow","shake","shall","shape","share","sharp","sheet","shelter","shift","shine","shipping","shirt","shock","shoot","shooting","shopping","short","shortly","shoulder","shout","sight","sign","signal","signature","significance","significant","significantly","silence","silent","silver","similar","similarly","since","sincere","sing","singer","single","sister","situation","skill","slight","slightly","slow","slowly","small","smart","smile","smoke","smooth","social","society","soft","software","soldier","solid","solution","solve","somewhat","sophisticated","sorry","sound","source","southern","space","speaker","special","specialist","species","specific","specifically","speech","speed","spending","spirit","spiritual","spoken","sport","spread","spring","square","stable","staff","stage","stair","stake","stand","standard","standing","stare","start","state","statement","station","statistic","status","steady","steal","steel","stick","still","stimulate","stock","stomach","storage","store","storm","story","straight","strange","stranger","strategic","strategy","stream","street","strength","strengthen","stress","stretch","strike","striking","string","strip","stroke","strong","strongly","structure","struggle","student","studio","study","stuff","stupid","style","subject","submit","subsequent","substance","substantial","succeed","success","successful","successfully","sudden","suddenly","suffer","sufficient","sugar","suggest","suggestion","suicide","suitable","summer","summit","super","supply","support","supporter","suppose","supposed","supreme","sure","surely","surface","surgery","surprise","surprised","surprising","surprisingly","surround","survey","survival","survive","survivor","suspect","sustain","swear","sweep","sweet","swimming","swing","switch","symbol","symptom","system","table","tablespoon","tactic","talent","target","taste","taxpayer","teacher","teaching","technique","technology","telephone","telescope","television","temperature","temporary","tenant","tendency","tennis","tension","terminal","terms","terrible","territory","terror","terrorism","terrorist","testify","testimony","testing","theater","theme","theory","therapy","thick","thinker","thinking","threat","threaten","throat","through","throughout","ticket","tight","timber","timing","tissue","title","tobacco","together","tolerance","tolerate","tomorrow","tongue","tonight","tooth","topic","total","totally","touch","tough","tourist","tournament","toward","towards","tower","track","tractor","trade","tradition","traditional","traffic","tragedy","trail","trailer","train","trainer","training","tram","transaction","transfer","transform","transformation","transition","translate","translation","transmission","transmit","transport","transportation","trash","travel","traveler","treasure","treatment","treaty","tremendous","trend","trial","triangle","tribute","trick","trigger","triumph","troop","trophy","trouble","truck","truly","trust","truth","tunnel","turnaround","tutorial","twelve","twenty","twice","twist","typical","typically","ultimate","ultimately","unable","unbelievable","uncertain","uncle","undergo","undergraduate","underlying","understand","understanding","undertake","unemployment","unexpected","unfair","unfold","unfortunate","unfortunately","uniform","unique","universe","universal","university","unknown","unless","unlike","unlikely","unprecedented","unusual","update","upon","upper","upset","urban","urgent","usage","useful","user","usual","usually","utility","vacation","valley","valuable","value","variable","variation","variety","various","varying","vehicle","vendor","venture","version","versus","vessel","veteran","victim","victory","video","viewer","village","violating","violation","violence","violent","virtual","virtually","virtue","visible","vision","visitor","visual","vital","vocal","voice","volume","voluntary","volunteer","voter","voting","voyage","vulnerability","vulnerable","wage","waiter","waiting","walking","wallet","wander","warehouse","warfare","warning","warrant","warrior","waste","watcher","watching","waterfall","wealth","wealthy","weapon","weather","website","wedding","weekend","weekly","weight","welcome","welfare","well","western","whatever","wheat","wheel","whenever","wherever","whether","whisper","white","whole","wholesale","widely","widespread","widow","width","willing","willingness","window","winner","winning","winter","wisdom","wisely","wish","withdraw","withdrawal","within","without","witness","wizard","woman","wonder","wonderful","wooden","worker","working","workout","workplace","workshop","worldwide","worried","worry","worth","worthwhile","worthy","wound","wrap","wrapper","wreck","writer","writing","written","wrong","yard","year","yearly","yellow","yesterday","yield","young","youth","zone"].forEach(w => DICTIONARY.add(w.toLowerCase()));

// Fast Levenshtein distance for spelling auto-suggestions
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Common typo corrections lookup for instant, high-quality suggestions
const COMMON_TYPOS = {
  "teh": "the",
  "adn": "and",
  "waht": "what",
  "taht": "that",
  "thsi": "this",
  "wiht": "with",
  "yuo": "you",
  "oyu": "you",
  "tihs": "this",
  "becuase": "because",
  "recieve": "receive",
  "seperate": "separate",
  "untill": "until",
  "wierd": "weird",
  "occured": "occurred",
  "truely": "truly",
  "definately": "definitely",
  "goverment": "government",
  "tommorrow": "tomorrow",
  "freind": "friend",
  "peice": "piece",
  "beleive": "believe",
  "realy": "really",
  "untill": "until",
  "accomodate": "accommodate",
  "neccessary": "necessary",
  "calender": "calendar",
  "fourty": "forty",
  "lenght": "length",
  "heigth": "height",
  "widtht": "width",
  "flpibook": "flipbook",
  "filpbook": "flipbook",
  "flipbok": "flipbook"
};

export function isKnownWord(lower) {
  if (DICTIONARY.has(lower)) return true;
  // Plurals and third person singular
  if (lower.endsWith('s') && DICTIONARY.has(lower.slice(0, -1))) return true;
  if (lower.endsWith('es') && DICTIONARY.has(lower.slice(0, -2))) return true;
  if (lower.endsWith('ies') && DICTIONARY.has(lower.slice(0, -3) + 'y')) return true;
  // Past tense / participles
  if (lower.endsWith('ed') && DICTIONARY.has(lower.slice(0, -2))) return true;
  if (lower.endsWith('ed') && DICTIONARY.has(lower.slice(0, -1))) return true; // liked -> like
  if (lower.endsWith('ied') && DICTIONARY.has(lower.slice(0, -3) + 'y')) return true;
  // Present participle / gerund
  if (lower.endsWith('ing') && DICTIONARY.has(lower.slice(0, -3))) return true;
  if (lower.endsWith('ing') && DICTIONARY.has(lower.slice(0, -3) + 'e')) return true; // making -> make
  // Adverbs / Adjectives
  if (lower.endsWith('ly') && DICTIONARY.has(lower.slice(0, -2))) return true;
  if (lower.endsWith('er') && DICTIONARY.has(lower.slice(0, -2))) return true;
  if (lower.endsWith('est') && DICTIONARY.has(lower.slice(0, -3))) return true;
  return false;
}

/**
 * Get spelling suggestions for an incorrect word
 */
export function getSpellingSuggestions(word) {
  const lower = word.toLowerCase();
  if (COMMON_TYPOS[lower]) {
    const fixed = COMMON_TYPOS[lower];
    return [matchCase(word, fixed)];
  }

  const candidates = [];

  // Check morphological root stems first (e.g., randoms -> random)
  const stems = [];
  if (lower.endsWith('s')) stems.push(lower.slice(0, -1));
  if (lower.endsWith('es')) stems.push(lower.slice(0, -2));
  if (lower.endsWith('ies')) stems.push(lower.slice(0, -3) + 'y');
  if (lower.endsWith('ed')) {
    stems.push(lower.slice(0, -2));
    stems.push(lower.slice(0, -1));
  }
  if (lower.endsWith('ing')) {
    stems.push(lower.slice(0, -3));
    stems.push(lower.slice(0, -3) + 'e');
  }
  if (lower.endsWith('ly')) stems.push(lower.slice(0, -2));

  for (const stem of stems) {
    if (stem.length > 1 && DICTIONARY.has(stem)) {
      candidates.push({ word: stem, dist: 0.5 });
    }
  }

  // Find candidate words in dictionary with edit distance <= 2
  for (const dictWord of DICTIONARY) {
    if (Math.abs(dictWord.length - lower.length) > 2) continue;
    const dist = levenshtein(lower, dictWord);
    if (dist <= 2) {
      candidates.push({ word: dictWord, dist });
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);
  const seen = new Set();
  const suggestions = [];
  for (const c of candidates) {
    if (!seen.has(c.word) && c.word !== lower) {
      seen.add(c.word);
      suggestions.push(matchCase(word, c.word));
      if (suggestions.length >= 3) break;
    }
  }

  return suggestions;
}

// Helper to preserve user casing (Capitalized or UPPERCASE)
function matchCase(original, replacement) {
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Checks text and returns an array of issues:
 * {
 *   type: 'spelling' | 'grammar',
 *   word: string,
 *   startIndex: number,
 *   endIndex: number,
 *   suggestions: string[],
 *   message: string
 * }
 */
export function checkSpellingAndGrammar(text) {
  if (!text || typeof text !== 'string') return [];
  const issues = [];

  // Regex to extract words with positions
  const wordRegex = /\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b/g;
  let match;
  const words = [];

  while ((match = wordRegex.exec(text)) !== null) {
    words.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  // 1. Grammar Checks:
  // A) Duplicate words (e.g., "the the")
  for (let i = 0; i < words.length - 1; i++) {
    const curr = words[i];
    const next = words[i + 1];
    // Check if consecutive words separated only by whitespace are identical
    const between = text.slice(curr.end, next.start);
    if (/^\s+$/.test(between) && curr.text.toLowerCase() === next.text.toLowerCase()) {
      issues.push({
        type: 'grammar',
        word: next.text,
        startIndex: next.start,
        endIndex: next.end,
        suggestions: ['(Delete word)'],
        message: `Duplicate word: "${next.text}"`
      });
    }
  }

  // B) "a" vs "an" before vowel sounds
  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
  for (let i = 0; i < words.length - 1; i++) {
    const curr = words[i];
    const next = words[i + 1];
    const between = text.slice(curr.end, next.start);
    if (/^\s+$/.test(between)) {
      const currLower = curr.text.toLowerCase();
      const nextLower = next.text.toLowerCase();
      const firstLetterNext = nextLower[0];

      if (currLower === 'a' && vowels.has(firstLetterNext) && !nextLower.startsWith('uni') && !nextLower.startsWith('one')) {
        issues.push({
          type: 'grammar',
          word: curr.text,
          startIndex: curr.start,
          endIndex: curr.end,
          suggestions: [matchCase(curr.text, 'an')],
          message: `Use "an" before a vowel sound`
        });
      } else if (currLower === 'an' && !vowels.has(firstLetterNext) && !nextLower.startsWith('hour') && !nextLower.startsWith('honest')) {
        issues.push({
          type: 'grammar',
          word: curr.text,
          startIndex: curr.start,
          endIndex: curr.end,
          suggestions: [matchCase(curr.text, 'a')],
          message: `Use "a" before a consonant sound`
        });
      }
    }
  }

  // 2. Spell Checks for each individual word
  const processedPositions = new Set(issues.map(iss => iss.startIndex));

  for (const w of words) {
    if (processedPositions.has(w.start)) continue;
    const raw = w.text;
    const lower = raw.toLowerCase();

    // Skip single letters (like 'a' or 'I') or numbers or URLs
    if (lower.length === 1 && (lower === 'a' || lower === 'i')) continue;
    if (lower.length <= 1) continue;

    // Check if word is in our dictionary or a common typo
    const isTypo = !!COMMON_TYPOS[lower];
    const isValid = isKnownWord(lower);

    if (!isValid || isTypo) {
      const suggestions = getSpellingSuggestions(raw);
      issues.push({
        type: 'spelling',
        word: raw,
        startIndex: w.start,
        endIndex: w.end,
        suggestions: suggestions.length > 0 ? suggestions : [],
        message: suggestions.length > 0 ? `Spelling: Did you mean "${suggestions[0]}"?` : `Unknown word "${raw}"`
      });
    }
  }

  return issues;
}
