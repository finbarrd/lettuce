/**
 * Fetches definitions for common words from the free dictionary API
 * and saves them as a bundled JS file for the game.
 * 
 * Run with: node scripts/fetch-definitions.js
 */

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Common 4-6 letter English words (high frequency) to prioritize
const COMMON_WORDS = [
  // 4-letter words
  'able','also','area','army','away','back','ball','band','bank','base','bath','bear','beat','been',
  'bell','best','bill','bird','blow','blue','boat','body','bomb','bone','book','born','boss','both',
  'burn','busy','call','calm','came','camp','card','care','cart','case','cash','cast','cell','chat',
  'chip','city','club','coal','coat','code','cold','come','cook','cool','copy','core','corn','cost',
  'crew','crop','dark','data','date','dead','deal','dear','debt','deep','desk','diet','dirt','dish',
  'disk','dock','does','done','door','dose','down','draw','drew','drop','drug','drum','dust','duty',
  'each','earn','ease','east','easy','edge','else','even','ever','evil','exam','exit','eyes','face',
  'fact','fail','fair','fall','fame','farm','fast','fate','fear','feed','feel','feet','fell','felt',
  'file','fill','film','find','fine','fire','firm','fish','five','flag','flat','fled','flew','flip',
  'flow','fold','folk','food','foot','ford','form','fort','foul','four','free','from','fuel','full',
  'fund','gain','game','gang','gate','gave','gear','gene','gift','girl','give','glad','goal','goes',
  'gold','golf','gone','good','grab','gray','grew','grey','grip','grow','gulf','gust','hack','hail',
  'hair','half','hall','hand','hang','harm','hate','have','head','hear','heat','held','hell','help',
  'herb','here','hero','hide','high','hill','hire','hold','hole','holy','home','hope','horn','host',
  'hour','huge','hung','hunt','hurt','hymn','idea','inch','iron','item','jack','jail','jazz','jean',
  'jobs','join','joke','jump','jury','just','keen','keep','kept','kick','kill','kind','king','knee',
  'knew','knit','knob','knot','know','lack','lady','laid','lake','lamb','lame','lamp','land','lane',
  'last','late','lawn','lead','leaf','lean','left','lend','lens','less','liar','lick','life','lift',
  'like','limb','lime','limp','line','link','lion','list','live','load','loaf','loan','lock','logo',
  'long','look','loop','lord','lose','loss','lost','lots','love','luck','lump','lung','lure','lurk',
  'made','mail','main','make','male','mall','many','mark','mask','mass','mate','maze','meal','mean',
  'meat','meet','melt','memo','menu','mere','mess','mild','mile','milk','mill','mind','mine','mint',
  'miss','moan','mode','mold','mood','moon','more','moss','most','moth','move','much','must','mute',
  'myth','nail','name','navy','near','neat','neck','need','nest','news','next','nice','nine','node',
  'none','noon','norm','nose','note','noun','odds','okay','once','only','onto','open','oral','ours',
  'over','pace','pack','page','paid','pain','pair','pale','palm','pane','park','part','pass','past',
  'path','peak','peel','peer','pets','pick','pier','pile','pine','pink','pipe','pity','plan','play',
  'plea','plod','plot','plow','plug','plus','poem','poet','poke','pole','poll','pond','pool','poor',
  'pope','pork','port','pose','post','pour','pour','pray','prey','prop','pull','pulp','pump','pure',
  'push','quit','quiz','race','rack','rage','raid','rail','rain','ramp','rank','rare','rash','rate',
  'raw','read','real','reap','rear','reed','reef','reel','rely','rent','rest','rich','ride','rift',
  'ring','riot','rise','risk','road','roam','roar','robe','rock','rode','role','roll','roof','room',
  'root','rope','rose','rude','ruin','rule','rush','rust','sack','safe','saga','said','sake','sale',
  'salt','same','sand','sang','sank','save','seal','seam','seat','seed','seek','seem','seen','self',
  'sell','send','sent','shed','ship','shop','shot','show','shut','sick','side','sigh','sign','silk',
  'sing','sink','site','size','skin','skip','slab','slam','slap','slew','slid','slim','slip','slot',
  'slow','slug','snap','snow','soak','soar','sock','soft','soil','sold','sole','some','song','soon',
  'sore','sort','soul','sour','span','spit','spot','spur','star','stay','stem','step','stew','stir',
  'stop','stub','such','suit','sulk','sure','surf','swan','swap','swim','tail','take','tale','talk',
  'tall','tame','tank','tape','task','taxi','team','tear','tell','tend','tent','term','test','text',
  'than','that','them','then','they','thin','this','thus','tick','tide','tidy','tier','tile','till',
  'tilt','time','tiny','tire','toad','toil','told','toll','tomb','tone','took','tool','tops','tore',
  'torn','toss','tour','town','trap','tray','tree','trim','trio','trip','trot','true','tube','tuck',
  'tug','tune','turn','twig','twin','type','ugly','unit','upon','urge','used','user','vain','vale',
  'vane','vary','vast','veil','vein','vent','verb','very','vest','veto','vice','view','vine','visa',
  'void','volt','vote','wade','wage','wait','wake','walk','wall','wand','want','ward','warm','warn',
  'warp','wart','wash','wasp','wave','wavy','waxy','weak','wear','weed','week','well','went','were',
  'west','what','when','whom','wick','wide','wife','wild','will','wilt','wind','wine','wing','wipe',
  'wire','wise','wish','wisp','with','woke','wolf','wood','wool','word','wore','work','worm','worn',
  'wrap','wren','wrist','yard','yawn','yeah','year','yell','yoga','yolk','your','zeal','zero','zone',
  // 5-letter words
  'about','above','abuse','acted','added','admit','adopt','adult','after','again','agent','agree',
  'ahead','alarm','album','alert','alien','align','alike','alive','alley','allow','alone','along',
  'alter','among','angel','anger','angle','angry','ankle','annoy','apart','apple','apply','arena',
  'argue','arise','armor','array','arrow','aside','asset','atlas','audio','avoid','awake','award',
  'aware','awful','bacon','badge','badly','baker','basic','basis','batch','beach','beard','beast',
  'began','begin','being','below','bench','berry','birth','black','blade','blame','bland','blank',
  'blast','blaze','bleed','blend','bless','blind','block','blood','bloom','blown','board','boast',
  'bonus','booth','bound','brain','brand','brave','bread','break','breed','brick','bride','brief',
  'bring','broad','broke','brook','brown','brush','buddy','build','built','bunch','burst','buyer',
  'cabin','cable','camel','candy','cargo','carry','catch','cause','cease','chain','chair','chalk',
  'chaos','charm','chase','cheap','cheat','check','cheek','cheer','chess','chest','chief','child',
  'chill','china','choir','chord','chose','chunk','claim','clash','class','clean','clear','clerk',
  'click','cliff','climb','cling','cloak','clock','clone','close','cloth','cloud','clown','coach',
  'coast','color','comet','comic','coral','couch','could','count','court','cover','crack','craft',
  'crane','crash','crazy','cream','creek','creep','crime','crisp','cross','crowd','crown','cruel',
  'crush','cubic','curve','cycle','daily','dance','death','decay','decoy','delay','delta','dense',
  'depot','depth','devil','diary','dirty','ditch','dizzy','dodge','donor','doubt','dough','draft',
  'drain','drama','drank','drawn','dream','dress','drift','drill','drink','drive','drone','drove',
  'drums','drunk','dying','eager','early','earth','eight','elder','elect','elite','email','empty',
  'enemy','enjoy','enter','entry','equal','error','essay','event','every','exact','exile','exist',
  'extra','faint','fairy','faith','false','fancy','fatal','fault','feast','fence','ferry','fewer',
  'fiber','field','fifth','fifty','fight','final','flame','flash','flesh','float','flock','flood',
  'floor','flour','fluid','flush','focal','focus','foggy','force','forge','forth','forum','found',
  'frame','frank','fraud','fresh','front','frost','froze','fruit','fully','funny','giant','given',
  'glass','gleam','glide','globe','gloom','glory','glove','goose','grace','grade','grain','grand',
  'grant','graph','grasp','grass','grave','great','greed','green','greet','grief','grill','grind',
  'groan','groom','gross','group','grove','grown','guard','guess','guest','guide','guilt','gusty',
  'habit','happy','harsh','haven','heart','heavy','hello','hence','honey','honor','horse','hotel',
  'house','human','humor','hurry','ideal','image','imply','inbox','index','inner','input','irony',
  'issue','ivory','jewel','joint','judge','juice','knife','knock','known','label','labor','large',
  'laser','later','laugh','layer','learn','lease','least','leave','legal','lemon','level','light',
  'limit','linen','liner','logic','loose','lorry','lover','lower','loyal','lucky','lunch','lying',
  'magic','major','maker','manor','march','match','maybe','mayor','medal','media','mercy','merit',
  'metal','meter','might','minor','minus','model','money','month','moral','motor','mount','mouse',
  'mouth','moved','movie','muddy','music','naive','nerve','never','newly','night','noble','noise',
  'north','noted','novel','nurse','occur','ocean','offer','often','olive','onset','opera','orbit',
  'order','organ','other','outer','owned','owner','oxide','ozone','paint','panel','panic','paper',
  'party','pasta','paste','patch','pause','peace','peach','pearl','penny','phase','phone','photo',
  'piano','piece','pilot','pitch','pixel','pizza','place','plain','plane','plant','plate','plaza',
  'plead','pluck','plumb','point','polar','pound','power','press','price','pride','prime','print',
  'prior','prize','probe','proof','prose','proud','prove','proxy','psalm','pulse','punch','pupil',
  'queen','quest','queue','quick','quiet','quite','quota','quote','radar','radio','raise','rally',
  'ranch','range','rapid','ratio','reach','react','ready','realm','rebel','refer','reign','relax',
  'relay','reply','reset','rider','ridge','rifle','right','rigid','risen','risky','rival','river',
  'robot','roots','rough','round','route','royal','rugby','ruler','rural','sadly','saint','salad',
  'sauce','scale','scare','scene','scent','scope','score','scout','seize','sense','serve','setup',
  'seven','shade','shake','shall','shame','shape','share','sharp','sheer','sheet','shelf','shell',
  'shift','shine','shirt','shock','shore','short','shout','sight','since','sixth','sixty','sized',
  'skill','skull','slave','sleep','slice','slide','slope','small','smart','smell','smile','smoke',
  'snail','snake','solar','solid','solve','sorry','sound','south','space','spare','spark','speak',
  'speed','spend','spent','spice','spill','spine','spite','split','spoke','spoon','spray','squad',
  'stack','staff','stage','stain','stake','stall','stamp','stand','stare','stark','start','state',
  'steak','steal','steam','steel','steep','steer','stern','stick','stiff','still','stock','stole',
  'stone','stood','stool','store','storm','story','stove','strap','straw','stray','strip','stuck',
  'study','stuff','stump','style','sugar','suite','sunny','super','surge','swamp','swear','sweat',
  'sweet','swept','swing','sword','syrup','table','taste','teach','teeth','tempo','thank','theft',
  'theme','there','thick','thief','thing','think','third','thorn','those','three','threw','throw',
  'thumb','tiger','tight','timer','tired','title','toast','today','token','total','touch','tough',
  'tower','toxic','trace','track','trade','trail','train','trait','trash','treat','trend','trial',
  'tribe','trick','tried','troop','truck','truly','trunk','trust','truth','tumor','twice','twist',
  'ultra','uncle','under','unfit','union','unite','unity','until','upper','upset','urban','usage',
  'usual','utter','valid','value','vault','venue','verse','video','vigor','vinyl','viral','virus',
  'visit','vital','vivid','vocal','vodka','voice','voter','wagon','waste','watch','water','weary',
  'weave','weigh','weird','whale','wheat','wheel','where','which','while','whine','white','whole',
  'whose','widow','width','witch','woman','women','world','worry','worse','worst','worth','would',
  'wound','wrath','write','wrong','wrote','yearn','yield','young','youth',
  // 6-letter words
  'absorb','accept','access','accuse','across','acting','action','active','actual','adjust',
  'admire','afford','agenda','almost','amount','anchor','animal','annual','answer','anyway',
  'appeal','appear','arctic','arrest','arrive','artist','assert','assign','assist','assume',
  'assure','attach','attack','attain','attend','autumn','basket','battle','beauty','became',
  'become','before','behalf','behave','behind','belong','better','beyond','bishop','bitter',
  'blanch','bloody','border','borrow','bottom','bounce','branch','breach','breath','breeze',
  'bridge','bright','broken','broker','bronze','brutal','bubble','bucket','budget','bullet',
  'bundle','burden','bureau','burner','butter','camera','cancel','candle','canvas','carbon',
  'career','carpet','castle','casual','caught','causal','census','centre','chance','change',
  'charge','cheese','cherry','chosen','church','circle','clinic','closed','closer','closet',
  'cobalt','coffee','colony','column','combat','comedy','coming','commit','common','comply',
  'copper','corner','costly','cotton','county','couple','course','cousin','covers','cradle',
  'create','credit','crisis','cruise','custom','damage','dancer','danger','dealer','debate',
  'decade','decide','decode','deeply','defeat','defend','define','degree','demand','denial',
  'depend','deploy','deputy','desert','design','desire','detail','detect','device','devote',
  'dialog','differ','digest','dimmer','dinner','direct','divine','doctor','domain','donate',
  'double','dozens','dragon','drawer','driven','driver','during','easily','eating','editor',
  'effect','effort','either','eleven','emerge','empire','employ','enable','endure','energy',
  'engage','engine','enough','ensure','entire','entity','equity','errand','escape','estate',
  'ethnic','evolve','exceed','except','excite','excuse','exempt','expand','expect','expert',
  'export','expose','extend','extent','fabric','facing','factor','fairly','fallen','family',
  'famous','farmer','father','faucet','feather','fellow','female','fender','figure','filled',
  'filter','finale','finder','finger','finish','fiscal','fitter','flight','flower','flying',
  'follow','forbid','forced','forest','forget','formal','former','fossil','foster','fourth',
  'freeze','frenzy','friend','frozen','fulfil','furious','future','gained','galaxy','gamble',
  'gaming','garage','garden','gather','gender','genius','gentle','gently','gifted','giving',
  'global','gloves','golden','govern','gravel','grease','greedy','groove','growth','guitar',
  'gunner','gutter','handle','happen','harbor','hardly','hatred','hazard','headed','health',
  'heaven','height','helmet','hereby','hidden','hinder','holder','honest','hooked','horror',
  'housed','humble','hunger','hunter','hybrid','ignore','impact','import','impose','income',
  'indeed','indoor','infant','inform','injure','injury','inland','inmate','insect','insert',
  'inside','insist','intact','intend','intent','invade','invent','invest','invite','inward',
  'island','itself','jacket','jersey','jungle','junior','kidney','kindle','knight','ladder',
  'lately','launch','lawyer','layout','leader','league','legacy','legend','lender','lesson',
  'letter','lifted','likely','linear','linger','linked','liquid','listen','little','lively',
  'living','locate','locker','lonely','longer','lovely','luxury','mainly','making','manage',
  'manner','marble','margin','marine','market','marvel','master','matter','medium','member',
  'memory','mental','mentor','merely','merger','method','middle','mighty','mining','minute',
  'mirror','mobile','modern','modest','moment','mortal','mostly','mother','motion','motive',
  'muster','mutual','muzzle','myself','narrow','nation','native','nature','nearby','nearly',
  'neatly','nicely','nimble','normal','notice','notion','number','object','obtain','occupy',
  'offend','office','offset','online','opener','oppose','option','orange','origin','orphan',
  'outfit','output','outrun','oxygen','packed','paddle','palace','parade','parent','partly',
  'patent','patrol','patron','patter','people','period','permit','person','phrase','pillar',
  'pirate','planet','plaque','player','please','pledge','plenty','plunge','pocket','poetry',
  'poison','police','policy','polish','polite','portal','poster','potato','potter','powder',
  'praise','prayer','prefer','pretty','prince','prison','profit','proper','proven','public',
  'punish','puppet','pursue','puzzle','rabbit','racial','racism','random','ranger','rarely',
  'rating','reader','really','reason','recall','recent','reckon','record','reduce','reform',
  'refuse','regard','regime','region','regret','relate','relief','remain','remedy','remote',
  'remove','render','rental','repair','repeat','report','rescue','resign','resist','resort',
  'result','retail','retain','retire','return','reveal','review','revolt','reward','rhythm',
  'ribbon','riding','rising','ritual','robust','rocket','rotate','ruling','runner','sacred',
  'safely','safety','sailor','salary','salmon','sample','sandal','saving','scared','scenic',
  'scheme','school','screen','script','search','season','second','secret','sector','secure',
  'select','senior','series','server','settle','severe','shadow','shaped','shield','signal',
  'silent','silver','simple','simply','singer','single','sister','sketch','slight','slowly',
  'smooth','snatch','soccer','social','socket','solely','solemn','sought','source','speech',
  'sphere','spirit','splash','spoken','sponge','spread','spring','square','stable','stance',
  'staple','status','steady','stolen','strain','strand','stream','street','strict','strike',
  'string','stripe','stroke','strong','struck','studio','stupid','submit','subtle','sudden',
  'suffer','summit','supply','surely','survey','switch','symbol','syntax','system','tackle',
  'tailor','talent','target','temple','tenant','tender','tennis','terror','thanks','thesis',
  'thirty','though','thread','threat','thrive','throne','thrown','thrust','ticket','timber',
  'tissue','tongue','toward','travel','treaty','tribal','trophy','trouble','tunnel','turkey',
  'turnip','twelve','typing','unable','unfair','unfold','unique','united','unlike','unlock',
  'unpack','update','upload','upward','useful','vacant','valley','vendor','verbal','versus',
  'vessel','victim','viewer','virtue','vision','visual','volume','voyage','waiter','wander',
  'warmth','wealth','weapon','weekly','weight','widely','wicked','window','winner','winter',
  'wisdom','within','wonder','worker','worthy','writer','yearly','yellow',
];

async function fetchDefinition(word) {
  try {
    const res = await fetch(`${API_BASE}${word.toLowerCase()}`);
    if (!res.ok) return null;
    const data = await res.json();
    for (const entry of data) {
      for (const meaning of entry.meanings || []) {
        for (const def of meaning.definitions || []) {
          if (def.definition) {
            return def.definition;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const definitions = {};
  const total = COMMON_WORDS.length;
  let fetched = 0;
  let found = 0;
  let failed = 0;

  console.log(`Fetching definitions for ${total} words...`);

  // Process in batches of 3 with delays
  for (let i = 0; i < total; i += 3) {
    const batch = COMMON_WORDS.slice(i, i + 3);
    const results = await Promise.all(
      batch.map(async (word) => {
        const def = await fetchDefinition(word);
        return { word, def };
      })
    );

    for (const { word, def } of results) {
      fetched++;
      if (def) {
        definitions[word.toLowerCase()] = def;
        found++;
      } else {
        failed++;
      }
    }

    if (fetched % 50 === 0 || fetched === total) {
      console.log(`  Progress: ${fetched}/${total} (${found} found, ${failed} missing)`);
    }

    // Rate limit: wait between batches (500ms to avoid throttling)
    if (i + 3 < total) {
      await delay(600);
    }
  }

  console.log(`\nDone! Found definitions for ${found}/${total} words.`);

  // Write as a JS module
  const output = `// Auto-generated definitions bundle - do not edit manually
// Generated: ${new Date().toISOString()}
// Words with definitions: ${found}

export const DEFINITIONS = ${JSON.stringify(definitions, null, 0)};
`;

  const { writeFileSync } = await import('fs');
  writeFileSync('src/game/definitions-bundle.js', output);
  console.log(`Written to src/game/definitions-bundle.js`);
}

main();
