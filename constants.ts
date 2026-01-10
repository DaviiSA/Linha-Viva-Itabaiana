
export const COLORS = {
  primary: '#003366', // Blue
  secondary: '#FF8C00', // Orange
  accent: '#FFFFFF', // White
};

// URL fornecida pelo usuário para a nova implantação do Google Apps Script
export const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbySWGKI-5tojenHKo8iTYdo5lyr4V1sPcWUsIheCVr6O0zSRvNEul-h6cBCsh37pm1h/exec";

// Nível crítico de estoque definido pelo usuário
export const CRITICAL_THRESHOLD = 6;

// Lista de viaturas única
const RAW_VEHICLES = [
  "1645", "1700", "1711", "1769", "1770", "1811", "1859", 
  "1847", "1845", "4001", "4006", "4013", "4014", 
  "4015", "4016", "4020", "4025"
];

export const VEHICLES = Array.from(new Set(RAW_VEHICLES)).sort((a, b) => Number(a) - Number(b));

export const ADMIN_PASSWORD = "Dsa21";

export const INITIAL_INVENTORY = [
  { id: "90394", name: "ABRACADEIRA CINTA AUTOTRAV POLIAM 230X9X3,0MM PRT", balance: 50 },
  { id: "90395", name: "ABRACADEIRA CINTA AUTOTRAV POLIAM 390X9X3,0MM PRT", balance: 50 },
  { id: "92453", name: "ALÇA ESTRIBO COBRE COM PERFURANTE 185MM (SPACE)", balance: 20 },
  { id: "92452", name: "ALÇA ESTRIBO COBRE COM PERFURANTE 95MM (SPACE)", balance: 20 },
  { id: "90459", name: "ALCA ESTRIBO NORM COMPR COBRE 100A 70X110MM 6,5MM (NORMAL)", balance: 15 },
  { id: "90316", name: "ALCA PREF DISTR ACO-ALUM 13,13-14,67MM 875MM VRM (CABO 4/0 AÇO)", balance: 10 },
  { id: "90317", name: "ALCA PREF DISTR ACO-ALUM 16,61-17,69MM 978MM VRD (CABO 336 AÇO)", balance: 10 },
  { id: "90315", name: "ALCA PREF DISTR ACO-ALUM 9,27-10,40MM 660MM AMR (CABO 1/0 AÇO)", balance: 10 },
  { id: "90711", name: "ALCA PREF DISTR LIGA-ALUM 13,10-14,65MM 865MM VRM (CABO 4/0 ALUMINIO)", balance: 10 },
  { id: "90712", name: "ALCA PREF DISTR LIGA-ALUM 16,20-18,15MM 430MM VRD (CABO 336 ALUMINIO)", balance: 10 },
  { id: "90706", name: "ALCA PREF DISTR LIGA-ALUM 5,70-6,45MM430MM LRJ (CABO 4 ALUMINIO)", balance: 10 },
  { id: "90707", name: "ALCA PREF DISTR LIGA-ALUM 7,30-8,20MM 610MM VRM (CABO 2 ALUMINIO)", balance: 10 },
  { id: "90708", name: "ALCA PREF DISTR LIGA-ALUM 9,15-10,25MM 670MM AMR (CABO 1/0 ALUMINIO)", balance: 10 },
  { id: "90313", name: "ALCA PREF SERV ACO-ALUM 5,81-6,53MM 445MM LRJ (CABO 4 AÇO)", balance: 25 },
  { id: "90314", name: "ALCA PREF SERV ACO-ALUM 7,36-8,27MM 625MM VRM (CABO 2 AÇO)", balance: 25 },
  { id: "90324", name: "ALCA PREF SERV CONC ACO-ALUM 9,80-10,50MM 355MM AMR", balance: 25 },
  { id: "90537", name: "ANEL AMAR ELASTOMERICO P/ESPACADOR 45X90X140MM CNZ", balance: 30 },
  { id: "90538", name: "ANEL AMAR ELASTOMERICO P/ISOLADOR 15,0KV 45X110X160MM VRM", balance: 30 },
  { id: "90393", name: "ARMACAO SECUNDARIA ACO GALV 1 ESTRIBO 110X50X5,0MM 125X16MM", balance: 15 },
  { id: "90389", name: "ARRUELA QUADRADA ACO GALV 38X18X3MM", balance: 100 },
  { id: "90542", name: "BRACO COMP TIPO C 15KV ACO-GALV 580X365X362MM", balance: 5 },
  { id: "90536", name: "BRACO COMP TIPO J 15/36,2KV ACO-GALV 1650X550MM", balance: 5 },
  { id: "90836", name: "CABO ACO-COBRE ATERRAMENTO, AC", balance: 100 },
  { id: "90296", name: "CABO ALUM CONCENTR 0,6/1KV XLPE 1F 1X10MM2+10MM2", balance: 200 },
  { id: "90284", name: "CABO ALUM MULTIPLEX 0,6/1,0KV XLPE 2F 2X1X35MM2+35MM2", balance: 200 },
  { id: "90285", name: "CABO ALUM MULTIPLEX 0,6/1,0KV XLPE 3F 3X1X10MM2+10MM2", balance: 200 },
  { id: "90288", name: "CABO ALUM MULTIPLEX 0,6/1,0KV XLPE 3F 3X1X35MM2+35MM2", balance: 200 },
  { id: "90289", name: "CABO ALUM MULTIPLEX 0,6/1,0KV XLPE 3F 3X1X70MM2+70MM2", balance: 200 },
  { id: "90563", name: "CABO ALUM MULTIPLEX NI 0,6/1,0KV XLPE 3F 3X1X35MM2+35MM2", balance: 200 },
  { id: "90259", name: "CABO ALUM NU 1F CA/AAC 1/0AWG POPPY", balance: 500 },
  { id: "90258", name: "CABO ALUM NU 1F CA/AAC 2AWG IRIS", balance: 500 },
  { id: "90261", name: "CABO ALUM NU 1F CA/AAC 336,4MCM TULIP", balance: 500 },
  { id: "90260", name: "CABO ALUM NU 1F CA/AAC 4/0AWG OXLIP", balance: 500 },
  { id: "90263", name: "CABO ALUM NU CAA/ASCR 1F 1/0AWG RAVEN", balance: 500 },
  { id: "90262", name: "CABO ALUM NU CAA/ASCR 1F 2AWG SPARROW", balance: 500 },
  { id: "90265", name: "CABO ALUM NU CAA/ASCR 1F 336,4MCM LINNET", balance: 500 },
  { id: "90560", name: "CABO ALUM NU CAA/ASCR 1F 4AWG SWAN", balance: 500 },
  { id: "90625", name: "CABO ALUM PROT DUP XLPE/HDPE 1F 15,0KV 120MM2 BLOQ CNZ", balance: 300 },
  { id: "90267", name: "CABO ALUM PROT SPL XLPE 1F 15,0KV 120MM2 BLOQ CNZ", balance: 300 },
  { id: "90268", name: "CABO ALUM PROT SPL XLPE 1F 15,0KV 185MM2 BLOQ CNZ (MAIS USADO)", balance: 500 },
  { id: "90266", name: "CABO ALUM PROT SPL XLPE 1F 15,0KV 50MM2 BLOQ CNZ", balance: 300 },
  { id: "90293", name: "CABO ALUM PROT SPL XLPE 1F 36,2KV 185MM2 BLOQ CNZ", balance: 100 },
  { id: "91095", name: "CABO COBR POTENC SUBT 0,6/1,0KV PVC/XLPE 1X6MM2 1F PRT", balance: 100 },
  { id: "92170", name: "CABO COBR PROT SPL XLPE 1F 15,0KV 35MM2 BLOQ CNZ (MAIS USADO)", balance: 200 },
  { id: "90945", name: "CABO COBRE NU RDA 70MM2 1F CL2A", balance: 100 },
  { id: "612481", name: "CABO FLEXIVEL EPROTENAX 2X2,5 (PP)", balance: 100 },
  { id: "90969", name: "CAPA PROT BORR SILIC PARA-RAIOS MT 15/36,2KV 70X97MM", balance: 40 },
  { id: "90586", name: "CAPA PROTETORA TRANSF MT PEAD 15/36,2KV 135X110MM", balance: 20 },
  { id: "90486", name: "CARTUCHO FERRAM CONECTOR CUNHA AMARELO 24,30MM", balance: 50 },
  { id: "90487", name: "CARTUCHO FERRAM CONECTOR CUNHA AZUL 14,80MM", balance: 50 },
  { id: "90488", name: "CARTUCHO FERRAM CONECTOR CUNHA VERMELHO 14,80MM", balance: 50 },
  { id: "37989", name: "CHASSI PARA IDENTIFICACAO", balance: 100 },
  { id: "90547", name: "CHAVE FUS DIST PRC BASE C 15,0KV 315A 1F MAN SEC", balance: 15 },
  { id: "90561", name: "CHAVE FUS DIST PRC BASE C 24,2KV 315A 1F MAN SEC", balance: 10 },
  { id: "90549", name: "CHAVE FUS RELIG DIST PRC BASE C 15,0KV 315A 1F MAN SEC 3INT", balance: 5 },
  { id: "90551", name: "CHAVE SECC FACA PORC EXT 11,4-13,8-15KV 400A 1F MAN SECO CEN", balance: 8 },
  { id: "90554", name: "CHAVE SECC FACA PORC EXT 11,4-13,8-15KV 630A 1F MAN SECO CEN", balance: 5 },
  { id: "614644", name: "CINTA P/ POSTE CIRCULAR 415 MM", balance: 20 },
  { id: "616179", name: "CINTA P/ POSTE CIRCULAR 430MM", balance: 20 },
  { id: "616181", name: "CINTA P/ POSTE CIRCULAR 480MM", balance: 20 },
  { id: "618663", name: "CINTA P/ POSTE CIRCULAR 520MM", balance: 20 },
  { id: "614647", name: "CINTA P/ POSTE CIRCULAR 530 MM", balance: 20 },
  { id: "614649", name: "CINTA P/ POSTE CIRCULAR 570 MM", balance: 20 },
  { id: "90213", name: "CINTA POSTE CIRCULAR ACO GALV 130MM 6MM 5000DAN", balance: 20 },
  { id: "90215", name: "CINTA POSTE CIRCULAR ACO GALV 160MM 6MM 5000DAN", balance: 20 },
  { id: "90216", name: "CINTA POSTE CIRCULAR ACO GALV 170MM 6MM 5000DAN", balance: 20 },
  { id: "90217", name: "CINTA POSTE CIRCULAR ACO GALV 180MM 6MM 5000DAN", balance: 20 },
  { id: "90218", name: "CINTA POSTE CIRCULAR ACO GALV 190MM 6MM 5000DAN", balance: 20 },
  { id: "90219", name: "CINTA POSTE CIRCULAR ACO GALV 200MM 6MM 5000DAN", balance: 20 },
  { id: "90221", name: "CINTA POSTE CIRCULAR ACO GALV 230MM 6MM 5000DAN", balance: 20 },
  { id: "90223", name: "CINTA POSTE CIRCULAR ACO GALV 250MM 6MM 5000DAN", balance: 20 },
  { id: "90224", name: "CINTA POSTE CIRCULAR ACO GALV 270MM 6MM 5000DAN", balance: 20 },
  { id: "90225", name: "CINTA POSTE CIRCULAR ACO GALV 280MM 6MM 5000DAN", balance: 20 },
  { id: "90226", name: "CINTA POSTE CIRCULAR ACO GALV 300MM 6MM 5000DAN", balance: 20 },
  { id: "90228", name: "CINTA POSTE CIRCULAR ACO GALV 320MM 6MM 5000DAN", balance: 20 },
  { id: "90234", name: "CINTA POSTE CIRCULAR ACO GALV 330MM 6MM 5000DAN", balance: 20 },
  { id: "90235", name: "CINTA POSTE CIRCULAR ACO GALV 340MM 6MM 5000DAN", balance: 20 },
  { id: "90236", name: "CINTA POSTE CIRCULAR ACO GALV 350MM 6MM 5000DAN", balance: 20 },
  { id: "90237", name: "CINTA POSTE CIRCULAR ACO GALV 360MM 6MM 5000DAN", balance: 20 },
  { id: "90458", name: "COBERTURA PROT GLV PEAD 325X220MM 36,2KV CNZ", balance: 10 },
  { id: "90471", name: "CONEC CUNHA RML COBR TP I 3,17-8,12/3,17-7,42MM CZ", balance: 100 },
  { id: "90472", name: "CONEC CUNHA RML COBR TP II 3,17-8,12/3,17-5,21MM VD", balance: 100 },
  { id: "9047