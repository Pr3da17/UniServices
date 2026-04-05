export interface Year {
  id: string;
  name: string;
}

export interface Formation {
  id: string;
  name: string;
  years?: Year[];
}

export interface Establishment {
  id: string;
  name: string;
  formations?: Formation[];
}

export interface University {
  id: string;
  name: string;
  baseUrl: string;
  establishments: Establishment[];
}

export const universities: University[] = [
  {
    id: "univ-artois",
    name: "Université d'Artois",
    baseUrl: "https://moodle.univ-artois.fr",
    establishments: [
      {
            "id": "est-2",
            "name": "Enseignement Uniquement À Distance",
            "formations": [
                  {
                        "id": "form-22",
                        "name": "DAEU"
                  },
                  {
                        "id": "form-23",
                        "name": "DU Responsable de l'éthique de l'IA"
                  },
                  {
                        "id": "form-24",
                        "name": "Master CLE - 对外汉语教学硕士",
                        "years": [
                              {
                                    "id": "year-663",
                                    "name": "Master 1"
                              },
                              {
                                    "id": "year-664",
                                    "name": "Master 1 - 中文"
                              },
                              {
                                    "id": "year-667",
                                    "name": "Master 1 - Français"
                              },
                              {
                                    "id": "year-665",
                                    "name": "Master 2"
                              },
                              {
                                    "id": "year-666",
                                    "name": "Master 2 - 中文"
                              },
                              {
                                    "id": "year-668",
                                    "name": "Master 2 - Français"
                              }
                        ]
                  },
                  {
                        "id": "form-25",
                        "name": "Master Études des Faits Religieux",
                        "years": [
                              {
                                    "id": "year-677",
                                    "name": "Master 1"
                              },
                              {
                                    "id": "year-678",
                                    "name": "Master 2"
                              }
                        ]
                  },
                  {
                        "id": "form-26",
                        "name": "Master FLE",
                        "years": [
                              {
                                    "id": "year-26",
                                    "name": "FLS - FOS"
                              },
                              {
                                    "id": "year-680",
                                    "name": "FLS - FOS - Master 1"
                              },
                              {
                                    "id": "year-681",
                                    "name": "FLS - FOS - Master 2"
                              },
                              {
                                    "id": "year-682",
                                    "name": "FLS - FOS - Masters sans accès aux cours"
                              }
                        ]
                  },
                  {
                        "id": "form-27",
                        "name": "Master Littératures de Jeunesse",
                        "years": [
                              {
                                    "id": "year-29",
                                    "name": "Master 1"
                              },
                              {
                                    "id": "year-30",
                                    "name": "Master 2"
                              }
                        ]
                  },
                  {
                        "id": "form-28",
                        "name": "Préparation à l'agrégation interne de lettres modernes à distance"
                  }
            ]
      },
      {
            "id": "est-16",
            "name": "Utiliser le menu déroulant pour choisir l'emplacement de votre cours"
      },
      {
            "id": "est-3",
            "name": "Arras - U.F.R. EGASS",
            "formations": [
                  {
                        "id": "form-31",
                        "name": "Licence",
                        "years": [
                              {
                                    "id": "year-33",
                                    "name": "L1 AES-EG"
                              },
                              {
                                    "id": "year-36",
                                    "name": "L1 AES-EG - Semestre 1"
                              },
                              {
                                    "id": "year-37",
                                    "name": "L1 AES-EG - Semestre 2"
                              },
                              {
                                    "id": "year-34",
                                    "name": "L2 AES-EG"
                              },
                              {
                                    "id": "year-38",
                                    "name": "L2 AES-EG - Semestre 3"
                              },
                              {
                                    "id": "year-39",
                                    "name": "L2 AES-EG - Semestre 4"
                              },
                              {
                                    "id": "year-35",
                                    "name": "L3 AES-EG"
                              },
                              {
                                    "id": "year-40",
                                    "name": "L3 AES-EG - Semestre 5"
                              },
                              {
                                    "id": "year-41",
                                    "name": "L3 AES-EG - Semestre 6"
                              }
                        ]
                  },
                  {
                        "id": "form-32",
                        "name": "Master",
                        "years": [
                              {
                                    "id": "year-42",
                                    "name": "Master 1"
                              },
                              {
                                    "id": "year-44",
                                    "name": "Master 1 - Enseignements de tronc commun"
                              },
                              {
                                    "id": "year-45",
                                    "name": "Master 1 - Mention Entrepreneuriat et Management de Projet"
                              },
                              {
                                    "id": "year-46",
                                    "name": "Master 1 - Mention Gestion des Ressources Humaines"
                              },
                              {
                                    "id": "year-47",
                                    "name": "Master 1 - Mention Management Sectoriel"
                              },
                              {
                                    "id": "year-48",
                                    "name": "Master 1 - Mention Marketing Vente"
                              },
                              {
                                    "id": "year-49",
                                    "name": "Master 1 - Mention Monnaie Banque Finance Assurance"
                              },
                              {
                                    "id": "year-43",
                                    "name": "Master 2"
                              },
                              {
                                    "id": "year-50",
                                    "name": "Master 2 - Enseignements de tronc commun"
                              },
                              {
                                    "id": "year-51",
                                    "name": "Master 2 - Mention Entrepreneuriat et Management de Projet"
                              },
                              {
                                    "id": "year-52",
                                    "name": "Master 2 - Mention Gestion des Ressources Humaines"
                              },
                              {
                                    "id": "year-53",
                                    "name": "Master 2 - Mention Management Sectoriel"
                              },
                              {
                                    "id": "year-54",
                                    "name": "Master 2 - Mention Marketing Vente"
                              },
                              {
                                    "id": "year-55",
                                    "name": "Master 2 - Mention Monnaie Banque Finance Assurance"
                              }
                        ]
                  }
            ]
      },
      {
            "id": "est-4",
            "name": "Arras - U.F.R. Histoire & Géographie",
            "formations": [
                  {
                        "id": "form-56",
                        "name": "Allemand"
                  },
                  {
                        "id": "form-57",
                        "name": "Anglais"
                  },
                  {
                        "id": "form-58",
                        "name": "Documentation"
                  },
                  {
                        "id": "form-59",
                        "name": "Espagnol"
                  },
                  {
                        "id": "form-60",
                        "name": "Histoire"
                  },
                  {
                        "id": "form-61",
                        "name": "Informatique"
                  },
                  {
                        "id": "form-62",
                        "name": "Géographie"
                  },
                  {
                        "id": "form-63",
                        "name": "Enseignements transversaux"
                  },
                  {
                        "id": "form-64",
                        "name": "Master DTAE",
                        "years": [
                              {
                                    "id": "year-65",
                                    "name": "Master 1 DTAE"
                              },
                              {
                                    "id": "year-66",
                                    "name": "Master 2 DTAE"
                              }
                        ]
                  },
                  {
                        "id": "form-658",
                        "name": "Préparation à l’agrégation interne HG"
                  }
            ]
      },
      {
            "id": "est-5",
            "name": "Arras - U.F.R. Langues",
            "formations": [
                  {
                        "id": "form-67",
                        "name": "Anglais"
                  },
                  {
                        "id": "form-68",
                        "name": "Arabe"
                  },
                  {
                        "id": "form-69",
                        "name": "Allemand"
                  },
                  {
                        "id": "form-70",
                        "name": "Chinois",
                        "years": [
                              {
                                    "id": "year-74",
                                    "name": "Dantille Xiaoshan"
                              },
                              {
                                    "id": "year-75",
                                    "name": "Lefebvre Romain"
                              },
                              {
                                    "id": "year-76",
                                    "name": "Marchand Sandrine"
                              },
                              {
                                    "id": "year-77",
                                    "name": "Verschelde Wei"
                              },
                              {
                                    "id": "year-78",
                                    "name": "Wei Man"
                              },
                              {
                                    "id": "year-79",
                                    "name": "Wei Wenke"
                              },
                              {
                                    "id": "year-80",
                                    "name": "Xie Jinjing"
                              },
                              {
                                    "id": "year-81",
                                    "name": "Roussette Yingzi"
                              },
                              {
                                    "id": "year-82",
                                    "name": "Chang Chin-Wei"
                              },
                              {
                                    "id": "year-83",
                                    "name": "Chen Lian"
                              }
                        ]
                  },
                  {
                        "id": "form-71",
                        "name": "Espagnol"
                  },
                  {
                        "id": "form-72",
                        "name": "Enseignements transversaux",
                        "years": [
                              {
                                    "id": "year-84",
                                    "name": "Culture numérique"
                              }
                        ]
                  },
                  {
                        "id": "form-73",
                        "name": "Italien"
                  },
                  {
                        "id": "form-685",
                        "name": "Master LMI"
                  }
            ]
      },
      {
            "id": "est-6",
            "name": "Arras - U.F.R. Lettres & Arts",
            "formations": [
                  {
                        "id": "form-85",
                        "name": "Arts du spectacle"
                  },
                  {
                        "id": "form-86",
                        "name": "DU FLEPES"
                  },
                  {
                        "id": "form-87",
                        "name": "Études cinématographiques"
                  },
                  {
                        "id": "form-88",
                        "name": "FLE - Présentiel",
                        "years": [
                              {
                                    "id": "year-94",
                                    "name": "Licence 3 - Parcours FLE"
                              },
                              {
                                    "id": "year-95",
                                    "name": "Master"
                              }
                        ]
                  },
                  {
                        "id": "form-89",
                        "name": "Langues"
                  },
                  {
                        "id": "form-90",
                        "name": "Lettres modernes",
                        "years": [
                              {
                                    "id": "year-96",
                                    "name": "Licence"
                              },
                              {
                                    "id": "year-98",
                                    "name": "Licence - S1"
                              },
                              {
                                    "id": "year-99",
                                    "name": "Licence - S2"
                              },
                              {
                                    "id": "year-100",
                                    "name": "Licence - S3"
                              },
                              {
                                    "id": "year-101",
                                    "name": "Licence - S4"
                              },
                              {
                                    "id": "year-102",
                                    "name": "Licence - S5"
                              },
                              {
                                    "id": "year-103",
                                    "name": "Licence - S6"
                              },
                              {
                                    "id": "year-97",
                                    "name": "Master"
                              },
                              {
                                    "id": "year-657",
                                    "name": "Préparation à l'agrégation interne"
                              },
                              {
                                    "id": "year-670",
                                    "name": "Parcours Documentation"
                              }
                        ]
                  },
                  {
                        "id": "form-91",
                        "name": "Lettres - Histoire - Droit",
                        "years": [
                              {
                                    "id": "year-104",
                                    "name": "Licence"
                              },
                              {
                                    "id": "year-105",
                                    "name": "Licence - S1"
                              },
                              {
                                    "id": "year-106",
                                    "name": "Licence - S2"
                              },
                              {
                                    "id": "year-107",
                                    "name": "Licence - S3"
                              },
                              {
                                    "id": "year-108",
                                    "name": "Licence - S4"
                              },
                              {
                                    "id": "year-109",
                                    "name": "Licence - S5"
                              },
                              {
                                    "id": "year-110",
                                    "name": "Licence - S6"
                              }
                        ]
                  },
                  {
                        "id": "form-92",
                        "name": "Muséographie"
                  },
                  {
                        "id": "form-93",
                        "name": "Enseignements transversaux"
                  }
            ]
      },
      {
            "id": "est-671",
            "name": "Béthune - E.I.A (Ecole d'Ingénieurs de l'Artois )",
            "formations": [
                  {
                        "id": "form-672",
                        "name": "Génie électrique",
                        "years": [
                              {
                                    "id": "year-673",
                                    "name": "1ère année"
                              },
                              {
                                    "id": "year-674",
                                    "name": "2ème année"
                              },
                              {
                                    "id": "year-675",
                                    "name": "3ème année"
                              }
                        ]
                  }
            ]
      },
      {
            "id": "est-7",
            "name": "Béthune - F.S.A. (Faculté des Sciences Appliquées)",
            "formations": [
                  {
                        "id": "form-111",
                        "name": "Génie civil",
                        "years": [
                              {
                                    "id": "year-116",
                                    "name": "Licence 3"
                              },
                              {
                                    "id": "year-117",
                                    "name": "Licence Pro CDCPE"
                              },
                              {
                                    "id": "year-118",
                                    "name": "Master 1"
                              },
                              {
                                    "id": "year-119",
                                    "name": "Master 2"
                              },
                              {
                                    "id": "year-120",
                                    "name": "Master 2 - M2BIVRD"
                              },
                              {
                                    "id": "year-558",
                                    "name": "Master 2 - M2BDEE"
                              }
                        ]
                  },
                  {
                        "id": "form-112",
                        "name": "Génie Industriel et Logistique",
                        "years": [
                              {
                                    "id": "year-121",
                                    "name": "Licence 3"
                              },
                              {
                                    "id": "year-122",
                                    "name": "LP Melog"
                              },
                              {
                                    "id": "year-123",
                                    "name": "Master 1"
                              },
                              {
                                    "id": "year-124",
                                    "name": "Master 2"
                              },
                              {
                                    "id": "year-125",
                                    "name": "Génie Logistique"
                              },
                              {
                                    "id": "year-126",
                                    "name": "Génie Logistique - Licence 3 GL"
                              },
                              {
                                    "id": "year-127",
                                    "name": "Génie Logistique - Licence 3 2MLS"
                              },
                              {
                                    "id": "year-128",
                                    "name": "Génie Logistique - Licence 3 Pro MELOG"
                              },
                              {
                                    "id": "year-129",
                                    "name": "Génie Logistique - Master 1 ICL"
                              },
                              {
                                    "id": "year-130",
                                    "name": "Génie Logistique - Master 2 ICL"
                              },
                              {
                                    "id": "year-131",
                                    "name": "Génie Logistique - Master 2 ICL - Option LOG"
                              },
                              {
                                    "id": "year-132",
                                    "name": "Génie Logistique - Master 2 ICL - Option OGP"
                              },
                              {
                                    "id": "year-133",
                                    "name": "Génie Logistique - Master 2 ICL - Option HOSP"
                              },
                              {
                                    "id": "year-134",
                                    "name": "Génie Logistique - GL - cours communs"
                              },
                              {
                                    "id": "year-135",
                                    "name": "Génie Industriel"
                              },
                              {
                                    "id": "year-136",
                                    "name": "Génie Industriel - Licence 3 GM2D"
                              },
                              {
                                    "id": "year-137",
                                    "name": "Génie Industriel - Licence 3 Pro CAO"
                              },
                              {
                                    "id": "year-138",
                                    "name": "Génie Industriel - Master 1 CMI"
                              },
                              {
                                    "id": "year-139",
                                    "name": "Génie Industriel - Master 2 CMI"
                              },
                              {
                                    "id": "year-140",
                                    "name": "Génie Industriel - GI - cours communs"
                              }
                        ]
                  },
                  {
                        "id": "form-113",
                        "name": "Génie électrique",
                        "years": [
                              {
                                    "id": "year-141",
                                    "name": "Licence 3 Génie électrique"
                              },
                              {
                                    "id": "year-142",
                                    "name": "Licence PRO MIGE"
                              },
                              {
                                    "id": "year-143",
                                    "name": "Master EEEA"
                              },
                              {
                                    "id": "year-144",
                                    "name": "Master EEEA - Master 1 - EEEA"
                              },
                              {
                                    "id": "year-145",
                                    "name": "Master EEEA - Master 2 - EEEA"
                              }
                        ]
                  },
                  {
                        "id": "form-114",
                        "name": "Génie énergétique - Maîtrise de l'énergie"
                  },
                  {
                        "id": "form-115",
                        "name": "Enseignements transversaux",
                        "years": [
                              {
                                    "id": "year-146",
                                    "name": "Licence 1 SPI"
                              },
                              {
                                    "id": "year-147",
                                    "name": "Licence 2 SPI"
                              }
                        ]
                  }
            ]
      },
      {
            "id": "est-8",
            "name": "Béthune - I.U.T. (Institut Universitaire de Technologie)",
            "formations": [
                  {
                        "id": "form-148",
                        "name": "DU CAP"
                  },
                  {
                        "id": "form-149",
                        "name": "DU Tremplin"
                  },
                  {
                        "id": "form-150",
                        "name": "DU DUSAMS"
                  },
                  {
                        "id": "form-151",
                        "name": "Chimie",
                        "years": [
                              {
                                    "id": "year-158",
                                    "name": "BUT Chimie"
                              },
                              {
                                    "id": "year-160",
                                    "name": "BUT Chimie - BUT 1"
                              },
                              {
                                    "id": "year-163",
                                    "name": "BUT Chimie - BUT 1 - BC1 (Analyse)"
                              },
                              {
                                    "id": "year-166",
                                    "name": "BUT Chimie - BUT 1 - BC2 (Synthèse)"
                              },
                              {
                                    "id": "year-169",
                                    "name": "BUT Chimie - BUT 1 - BC3 (Elaborer)"
                              },
                              {
                                    "id": "year-172",
                                    "name": "BUT Chimie - BUT 1 - BC4 (Produire)"
                              },
                              {
                                    "id": "year-175",
                                    "name": "BUT Chimie - BUT 1 - BC5 (Gérer)"
                              },
                              {
                                    "id": "year-178",
                                    "name": "BUT Chimie - BUT 1 - BC6 (Contrôler)"
                              },
                              {
                                    "id": "year-161",
                                    "name": "BUT Chimie - BUT 2"
                              },
                              {
                                    "id": "year-164",
                                    "name": "BUT Chimie - BUT 2 - BC1 (Analyse)"
                              },
                              {
                                    "id": "year-167",
                                    "name": "BUT Chimie - BUT 2 - BC2 (Synthèse)"
                              },
                              {
                                    "id": "year-170",
                                    "name": "BUT Chimie - BUT 2 - BC3 (Elaborer)"
                              },
                              {
                                    "id": "year-173",
                                    "name": "BUT Chimie - BUT 2 - BC4 (Produire)"
                              },
                              {
                                    "id": "year-176",
                                    "name": "BUT Chimie - BUT 2 - BC5 (Gérer)"
                              },
                              {
                                    "id": "year-179",
                                    "name": "BUT Chimie - BUT 2 - BC6 (Contrôler)"
                              },
                              {
                                    "id": "year-162",
                                    "name": "BUT Chimie - BUT 3"
                              },
                              {
                                    "id": "year-165",
                                    "name": "BUT Chimie - BUT 3 - BC1 (Analyse)"
                              },
                              {
                                    "id": "year-168",
                                    "name": "BUT Chimie - BUT 3 - BC2 (Synthèse)"
                              },
                              {
                                    "id": "year-171",
                                    "name": "BUT Chimie - BUT 3 - BC3 (Elaborer)"
                              },
                              {
                                    "id": "year-174",
                                    "name": "BUT Chimie - BUT 3 - BC4 (Produire)"
                              },
                              {
                                    "id": "year-177",
                                    "name": "BUT Chimie - BUT 3 - BC5 (Gérer)"
                              },
                              {
                                    "id": "year-180",
                                    "name": "BUT Chimie - BUT 3 - BC6 (Contrôler)"
                              },
                              {
                                    "id": "year-159",
                                    "name": "BUT Chimie Alternance"
                              },
                              {
                                    "id": "year-181",
                                    "name": "BUT Chimie Alternance - BUT 1"
                              },
                              {
                                    "id": "year-184",
                                    "name": "BUT Chimie Alternance - BUT 1 - BC1 (Analyse)"
                              },
                              {
                                    "id": "year-187",
                                    "name": "BUT Chimie Alternance - BUT 1 - BC2 (Synthèse)"
                              },
                              {
                                    "id": "year-190",
                                    "name": "BUT Chimie Alternance - BUT 1 - BC3 (Elaborer)"
                              },
                              {
                                    "id": "year-194",
                                    "name": "BUT Chimie Alternance - BUT 1 - BC4 (Produire)"
                              },
                              {
                                    "id": "year-197",
                                    "name": "BUT Chimie Alternance - BUT 1 - BC5 (Gérer)"
                              },
                              {
                                    "id": "year-200",
                                    "name": "BUT Chimie Alternance - BUT 1 - BC6 (Contrôler)"
                              },
                              {
                                    "id": "year-182",
                                    "name": "BUT Chimie Alternance - BUT 2"
                              },
                              {
                                    "id": "year-185",
                                    "name": "BUT Chimie Alternance - BUT 2 - BC1 (Analyse)"
                              },
                              {
                                    "id": "year-188",
                                    "name": "BUT Chimie Alternance - BUT 2 - BC2 (Synthèse)"
                              },
                              {
                                    "id": "year-192",
                                    "name": "BUT Chimie Alternance - BUT 2 - BC3 (Elaborer)"
                              },
                              {
                                    "id": "year-195",
                                    "name": "BUT Chimie Alternance - BUT 2 - BC4 (Produire)"
                              },
                              {
                                    "id": "year-198",
                                    "name": "BUT Chimie Alternance - BUT 2 - BC5 (Gérer)"
                              },
                              {
                                    "id": "year-201",
                                    "name": "BUT Chimie Alternance - BUT 2 - BC6 (Contrôler)"
                              },
                              {
                                    "id": "year-183",
                                    "name": "BUT Chimie Alternance - BUT 3"
                              },
                              {
                                    "id": "year-186",
                                    "name": "BUT Chimie Alternance - BUT 3 - BC1 (Analyse)"
                              },
                              {
                                    "id": "year-189",
                                    "name": "BUT Chimie Alternance - BUT 3 - BC2 (Synthèse)"
                              },
                              {
                                    "id": "year-193",
                                    "name": "BUT Chimie Alternance - BUT 3 - BC3 (Elaborer)"
                              },
                              {
                                    "id": "year-196",
                                    "name": "BUT Chimie Alternance - BUT 3 - BC4 (Produire)"
                              },
                              {
                                    "id": "year-199",
                                    "name": "BUT Chimie Alternance - BUT 3 - BC5 (Gérer)"
                              },
                              {
                                    "id": "year-202",
                                    "name": "BUT Chimie Alternance - BUT 3 - BC6 (Contrôler)"
                              }
                        ]
                  },
                  {
                        "id": "form-152",
                        "name": "Génie Civil",
                        "years": [
                              {
                                    "id": "year-203",
                                    "name": "Formation Initiale"
                              },
                              {
                                    "id": "year-205",
                                    "name": "Formation Initiale - S1"
                              },
                              {
                                    "id": "year-223",
                                    "name": "Formation Initiale - S1 - BC 1"
                              },
                              {
                                    "id": "year-229",
                                    "name": "Formation Initiale - S1 - BC 2"
                              },
                              {
                                    "id": "year-243",
                                    "name": "Formation Initiale - S1 - BC 3"
                              },
                              {
                                    "id": "year-254",
                                    "name": "Formation Initiale - S1 - BC 4"
                              },
                              {
                                    "id": "year-266",
                                    "name": "Formation Initiale - S1 - BC 5"
                              },
                              {
                                    "id": "year-278",
                                    "name": "Formation Initiale - S1 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-290",
                                    "name": "Formation Initiale - S1 - Portefolio"
                              },
                              {
                                    "id": "year-302",
                                    "name": "Formation Initiale - S1 - Documents Administratifs"
                              },
                              {
                                    "id": "year-207",
                                    "name": "Formation Initiale - S2"
                              },
                              {
                                    "id": "year-224",
                                    "name": "Formation Initiale - S2 - BC 1"
                              },
                              {
                                    "id": "year-230",
                                    "name": "Formation Initiale - S2 - BC 2"
                              },
                              {
                                    "id": "year-244",
                                    "name": "Formation Initiale - S2 - BC 3"
                              },
                              {
                                    "id": "year-255",
                                    "name": "Formation Initiale - S2 - BC 4"
                              },
                              {
                                    "id": "year-267",
                                    "name": "Formation Initiale - S2 - BC 5"
                              },
                              {
                                    "id": "year-279",
                                    "name": "Formation Initiale - S2 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-291",
                                    "name": "Formation Initiale - S2 - Portefolio"
                              },
                              {
                                    "id": "year-303",
                                    "name": "Formation Initiale - S2 - Documents Administratifs"
                              },
                              {
                                    "id": "year-209",
                                    "name": "Formation Initiale - S3"
                              },
                              {
                                    "id": "year-225",
                                    "name": "Formation Initiale - S3 - BC 1"
                              },
                              {
                                    "id": "year-231",
                                    "name": "Formation Initiale - S3 - BC 2"
                              },
                              {
                                    "id": "year-245",
                                    "name": "Formation Initiale - S3 - BC 3"
                              },
                              {
                                    "id": "year-256",
                                    "name": "Formation Initiale - S3 - BC 4"
                              },
                              {
                                    "id": "year-268",
                                    "name": "Formation Initiale - S3 - BC 5"
                              },
                              {
                                    "id": "year-280",
                                    "name": "Formation Initiale - S3 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-292",
                                    "name": "Formation Initiale - S3 - Portefolio"
                              },
                              {
                                    "id": "year-304",
                                    "name": "Formation Initiale - S3 - Documents Administratifs"
                              },
                              {
                                    "id": "year-211",
                                    "name": "Formation Initiale - S4"
                              },
                              {
                                    "id": "year-226",
                                    "name": "Formation Initiale - S4 - BC 1"
                              },
                              {
                                    "id": "year-233",
                                    "name": "Formation Initiale - S4 - BC 2"
                              },
                              {
                                    "id": "year-232",
                                    "name": "Formation Initiale - S4 - BC 3"
                              },
                              {
                                    "id": "year-257",
                                    "name": "Formation Initiale - S4 - BC 4"
                              },
                              {
                                    "id": "year-269",
                                    "name": "Formation Initiale - S4 - BC 5"
                              },
                              {
                                    "id": "year-281",
                                    "name": "Formation Initiale - S4 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-293",
                                    "name": "Formation Initiale - S4 - Portefolio"
                              },
                              {
                                    "id": "year-305",
                                    "name": "Formation Initiale - S4 - Documents Administratifs"
                              },
                              {
                                    "id": "year-213",
                                    "name": "Formation Initiale - S5"
                              },
                              {
                                    "id": "year-227",
                                    "name": "Formation Initiale - S5 - BC 1"
                              },
                              {
                                    "id": "year-234",
                                    "name": "Formation Initiale - S5 - BC 2"
                              },
                              {
                                    "id": "year-246",
                                    "name": "Formation Initiale - S5 - BC 3"
                              },
                              {
                                    "id": "year-258",
                                    "name": "Formation Initiale - S5 - BC 4"
                              },
                              {
                                    "id": "year-270",
                                    "name": "Formation Initiale - S5 - BC 5"
                              },
                              {
                                    "id": "year-282",
                                    "name": "Formation Initiale - S5 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-294",
                                    "name": "Formation Initiale - S5 - Portefolio"
                              },
                              {
                                    "id": "year-306",
                                    "name": "Formation Initiale - S5 - Documents Administratifs"
                              },
                              {
                                    "id": "year-215",
                                    "name": "Formation Initiale - S6"
                              },
                              {
                                    "id": "year-228",
                                    "name": "Formation Initiale - S6 - BC 1"
                              },
                              {
                                    "id": "year-235",
                                    "name": "Formation Initiale - S6 - BC 2"
                              },
                              {
                                    "id": "year-247",
                                    "name": "Formation Initiale - S6 - BC 3"
                              },
                              {
                                    "id": "year-259",
                                    "name": "Formation Initiale - S6 - BC 4"
                              },
                              {
                                    "id": "year-271",
                                    "name": "Formation Initiale - S6 - BC 5"
                              },
                              {
                                    "id": "year-283",
                                    "name": "Formation Initiale - S6 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-295",
                                    "name": "Formation Initiale - S6 - Portefolio"
                              },
                              {
                                    "id": "year-307",
                                    "name": "Formation Initiale - S6 - Documents Administratifs"
                              },
                              {
                                    "id": "year-204",
                                    "name": "Formation Apprentissage"
                              },
                              {
                                    "id": "year-206",
                                    "name": "Formation Apprentissage - S1"
                              },
                              {
                                    "id": "year-217",
                                    "name": "Formation Apprentissage - S1 - BC 1"
                              },
                              {
                                    "id": "year-236",
                                    "name": "Formation Apprentissage - S1 - BC 2"
                              },
                              {
                                    "id": "year-248",
                                    "name": "Formation Apprentissage - S1 - BC 3"
                              },
                              {
                                    "id": "year-260",
                                    "name": "Formation Apprentissage - S1 - BC 4"
                              },
                              {
                                    "id": "year-272",
                                    "name": "Formation Apprentissage - S1 - BC 5"
                              },
                              {
                                    "id": "year-284",
                                    "name": "Formation Apprentissage - S1 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-296",
                                    "name": "Formation Apprentissage - S1 - Portefolio"
                              },
                              {
                                    "id": "year-308",
                                    "name": "Formation Apprentissage - S1 - Documents Administratifs"
                              },
                              {
                                    "id": "year-208",
                                    "name": "Formation Apprentissage - S2"
                              },
                              {
                                    "id": "year-218",
                                    "name": "Formation Apprentissage - S2 - BC 1"
                              },
                              {
                                    "id": "year-237",
                                    "name": "Formation Apprentissage - S2 - BC 2"
                              },
                              {
                                    "id": "year-249",
                                    "name": "Formation Apprentissage - S2 - BC 3"
                              },
                              {
                                    "id": "year-261",
                                    "name": "Formation Apprentissage - S2 - BC 4"
                              },
                              {
                                    "id": "year-273",
                                    "name": "Formation Apprentissage - S2 - BC 5"
                              },
                              {
                                    "id": "year-285",
                                    "name": "Formation Apprentissage - S2 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-297",
                                    "name": "Formation Apprentissage - S2 - Portefolio"
                              },
                              {
                                    "id": "year-309",
                                    "name": "Formation Apprentissage - S2 - Documents Administratifs"
                              },
                              {
                                    "id": "year-210",
                                    "name": "Formation Apprentissage - S3"
                              },
                              {
                                    "id": "year-219",
                                    "name": "Formation Apprentissage - S3 - BC 1"
                              },
                              {
                                    "id": "year-238",
                                    "name": "Formation Apprentissage - S3 - BC 2"
                              },
                              {
                                    "id": "year-250",
                                    "name": "Formation Apprentissage - S3 - BC 3"
                              },
                              {
                                    "id": "year-262",
                                    "name": "Formation Apprentissage - S3 - BC 4"
                              },
                              {
                                    "id": "year-274",
                                    "name": "Formation Apprentissage - S3 - BC 5"
                              },
                              {
                                    "id": "year-286",
                                    "name": "Formation Apprentissage - S3 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-298",
                                    "name": "Formation Apprentissage - S3 - Portefolio"
                              },
                              {
                                    "id": "year-310",
                                    "name": "Formation Apprentissage - S3 - Documents Administratifs"
                              },
                              {
                                    "id": "year-212",
                                    "name": "Formation Apprentissage - S4"
                              },
                              {
                                    "id": "year-220",
                                    "name": "Formation Apprentissage - S4 - BC 1"
                              },
                              {
                                    "id": "year-239",
                                    "name": "Formation Apprentissage - S4 - BC 2"
                              },
                              {
                                    "id": "year-251",
                                    "name": "Formation Apprentissage - S4 - BC 3"
                              },
                              {
                                    "id": "year-263",
                                    "name": "Formation Apprentissage - S4 - BC 4"
                              },
                              {
                                    "id": "year-275",
                                    "name": "Formation Apprentissage - S4 - BC 5"
                              },
                              {
                                    "id": "year-287",
                                    "name": "Formation Apprentissage - S4 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-299",
                                    "name": "Formation Apprentissage - S4 - Portefolio"
                              },
                              {
                                    "id": "year-311",
                                    "name": "Formation Apprentissage - S4 - Documents Administratifs"
                              },
                              {
                                    "id": "year-214",
                                    "name": "Formation Apprentissage - S5"
                              },
                              {
                                    "id": "year-221",
                                    "name": "Formation Apprentissage - S5 - BC 1"
                              },
                              {
                                    "id": "year-241",
                                    "name": "Formation Apprentissage - S5 - BC 2"
                              },
                              {
                                    "id": "year-252",
                                    "name": "Formation Apprentissage - S5 - BC 3"
                              },
                              {
                                    "id": "year-264",
                                    "name": "Formation Apprentissage - S5 - BC 4"
                              },
                              {
                                    "id": "year-276",
                                    "name": "Formation Apprentissage - S5 - BC 5"
                              },
                              {
                                    "id": "year-288",
                                    "name": "Formation Apprentissage - S5 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-300",
                                    "name": "Formation Apprentissage - S5 - Portefolio"
                              },
                              {
                                    "id": "year-312",
                                    "name": "Formation Apprentissage - S5 - Documents Administratifs"
                              },
                              {
                                    "id": "year-216",
                                    "name": "Formation Apprentissage - S6"
                              },
                              {
                                    "id": "year-222",
                                    "name": "Formation Apprentissage - S6 - BC 1"
                              },
                              {
                                    "id": "year-242",
                                    "name": "Formation Apprentissage - S6 - BC 2"
                              },
                              {
                                    "id": "year-253",
                                    "name": "Formation Apprentissage - S6 - BC 3"
                              },
                              {
                                    "id": "year-265",
                                    "name": "Formation Apprentissage - S6 - BC 4"
                              },
                              {
                                    "id": "year-277",
                                    "name": "Formation Apprentissage - S6 - BC 5"
                              },
                              {
                                    "id": "year-289",
                                    "name": "Formation Apprentissage - S6 - Enseignements Transversaux"
                              },
                              {
                                    "id": "year-301",
                                    "name": "Formation Apprentissage - S6 - Portefolio"
                              },
                              {
                                    "id": "year-313",
                                    "name": "Formation Apprentissage - S6 - Documents Administratifs"
                              }
                        ]
                  },
                  {
                        "id": "form-153",
                        "name": "Génie Electrique et Informatique Industrielle (GEII)",
                        "years": [
                              {
                                    "id": "year-314",
                                    "name": "BUT GEII - FA"
                              },
                              {
                                    "id": "year-316",
                                    "name": "BUT GEII - FA - S1"
                              },
                              {
                                    "id": "year-318",
                                    "name": "BUT GEII - FA - S2"
                              },
                              {
                                    "id": "year-320",
                                    "name": "BUT GEII - FA - S3"
                              },
                              {
                                    "id": "year-322",
                                    "name": "BUT GEII - FA - S4"
                              },
                              {
                                    "id": "year-324",
                                    "name": "BUT GEII - FA - S5"
                              },
                              {
                                    "id": "year-326",
                                    "name": "BUT GEII - FA - S6"
                              },
                              {
                                    "id": "year-315",
                                    "name": "BUT GEII - FI"
                              },
                              {
                                    "id": "year-317",
                                    "name": "BUT GEII - FI - S1"
                              },
                              {
                                    "id": "year-319",
                                    "name": "BUT GEII - FI - S2"
                              },
                              {
                                    "id": "year-321",
                                    "name": "BUT GEII - FI - S3"
                              },
                              {
                                    "id": "year-323",
                                    "name": "BUT GEII - FI - S4"
                              },
                              {
                                    "id": "year-325",
                                    "name": "BUT GEII - FI - S5"
                              },
                              {
                                    "id": "year-327",
                                    "name": "BUT GEII - FI - S6"
                              }
                        ]
                  },
                  {
                        "id": "form-154",
                        "name": "BUT Génie Mécanique et Productique",
                        "years": [
                              {
                                    "id": "year-335",
                                    "name": "Informations générales"
                              },
                              {
                                    "id": "year-328",
                                    "name": "Anglais"
                              },
                              {
                                    "id": "year-329",
                                    "name": "Communication"
                              },
                              {
                                    "id": "year-330",
                                    "name": "Conception"
                              },
                              {
                                    "id": "year-331",
                                    "name": "Dimensionnement des Structures"
                              },
                              {
                                    "id": "year-332",
                                    "name": "Elec – Auto"
                              },
                              {
                                    "id": "year-334",
                                    "name": "Fabrication"
                              },
                              {
                                    "id": "year-336",
                                    "name": "Informatique"
                              },
                              {
                                    "id": "year-337",
                                    "name": "Mathématiques"
                              },
                              {
                                    "id": "year-338",
                                    "name": "Mécanique"
                              },
                              {
                                    "id": "year-339",
                                    "name": "Métrologie"
                              },
                              {
                                    "id": "year-346",
                                    "name": "OPI"
                              },
                              {
                                    "id": "year-341",
                                    "name": "Parcours Innovation pour l’Industrie"
                              },
                              {
                                    "id": "year-342",
                                    "name": "Parcours Management de Process Industriel"
                              },
                              {
                                    "id": "year-343",
                                    "name": "Portefolio"
                              },
                              {
                                    "id": "year-344",
                                    "name": "PPP"
                              },
                              {
                                    "id": "year-333",
                                    "name": "Robotique"
                              },
                              {
                                    "id": "year-345",
                                    "name": "SAÉ"
                              },
                              {
                                    "id": "year-340",
                                    "name": "Sciences des matériaux"
                              },
                              {
                                    "id": "year-686",
                                    "name": "Stage"
                              }
                        ]
                  },
                  {
                        "id": "form-155",
                        "name": "BUT QLIO",
                        "years": [
                              {
                                    "id": "year-347",
                                    "name": "FI"
                              },
                              {
                                    "id": "year-349",
                                    "name": "FI - S1"
                              },
                              {
                                    "id": "year-350",
                                    "name": "FI - S2"
                              },
                              {
                                    "id": "year-351",
                                    "name": "FI - S3"
                              },
                              {
                                    "id": "year-352",
                                    "name": "FI - S4"
                              },
                              {
                                    "id": "year-353",
                                    "name": "FI - S5"
                              },
                              {
                                    "id": "year-354",
                                    "name": "FI - S6"
                              },
                              {
                                    "id": "year-348",
                                    "name": "FA"
                              },
                              {
                                    "id": "year-355",
                                    "name": "FA - S1"
                              },
                              {
                                    "id": "year-356",
                                    "name": "FA - S2"
                              },
                              {
                                    "id": "year-357",
                                    "name": "FA - S3"
                              },
                              {
                                    "id": "year-358",
                                    "name": "FA - S4"
                              },
                              {
                                    "id": "year-359",
                                    "name": "FA - S5"
                              },
                              {
                                    "id": "year-361",
                                    "name": "FA - S6"
                              }
                        ]
                  },
                  {
                        "id": "form-156",
                        "name": "Réseaux Et Télécoms",
                        "years": [
                              {
                                    "id": "year-362",
                                    "name": "BUT S1"
                              },
                              {
                                    "id": "year-363",
                                    "name": "BUT S2"
                              },
                              {
                                    "id": "year-364",
                                    "name": "BUT S3"
                              },
                              {
                                    "id": "year-365",
                                    "name": "BUT S4"
                              },
                              {
                                    "id": "year-366",
                                    "name": "BUT S5"
                              },
                              {
                                    "id": "year-367",
                                    "name": "BUT S6"
                              },
                              {
                                    "id": "year-368",
                                    "name": "Administration et autres"
                              }
                        ]
                  },
                  {
                        "id": "form-157",
                        "name": "Licence Professionnelle",
                        "years": [
                              {
                                    "id": "year-369",
                                    "name": "LP AGEQ"
                              },
                              {
                                    "id": "year-370",
                                    "name": "LP QHSE"
                              },
                              {
                                    "id": "year-377",
                                    "name": "LP HYDRAU"
                              },
                              {
                                    "id": "year-379",
                                    "name": "LP NUT"
                              }
                        ]
                  }
            ]
      },
      {
            "id": "est-9",
            "name": "Douai - Faculté de Droit",
            "formations": [
                  {
                        "id": "form-383",
                        "name": "Licence",
                        "years": [
                              {
                                    "id": "year-386",
                                    "name": "S1"
                              },
                              {
                                    "id": "year-392",
                                    "name": "S1 - Cours"
                              },
                              {
                                    "id": "year-393",
                                    "name": "S1 - TD"
                              },
                              {
                                    "id": "year-387",
                                    "name": "S2"
                              },
                              {
                                    "id": "year-394",
                                    "name": "S2 - Cours"
                              },
                              {
                                    "id": "year-399",
                                    "name": "S2 - TD"
                              },
                              {
                                    "id": "year-388",
                                    "name": "S3"
                              },
                              {
                                    "id": "year-395",
                                    "name": "S3 - Cours"
                              },
                              {
                                    "id": "year-400",
                                    "name": "S3 - TD"
                              },
                              {
                                    "id": "year-389",
                                    "name": "S4"
                              },
                              {
                                    "id": "year-396",
                                    "name": "S4 - Cours"
                              },
                              {
                                    "id": "year-401",
                                    "name": "S4 - TD"
                              },
                              {
                                    "id": "year-390",
                                    "name": "S5"
                              },
                              {
                                    "id": "year-397",
                                    "name": "S5 - Cours"
                              },
                              {
                                    "id": "year-402",
                                    "name": "S5 - TD"
                              },
                              {
                                    "id": "year-391",
                                    "name": "S6"
                              },
                              {
                                    "id": "year-398",
                                    "name": "S6 - Cours"
                              },
                              {
                                    "id": "year-403",
                                    "name": "S6 - TD"
                              }
                        ]
                  },
                  {
                        "id": "form-384",
                        "name": "Licence professionnelle (activités juridiques)",
                        "years": [
                              {
                                    "id": "year-404",
                                    "name": "S1"
                              },
                              {
                                    "id": "year-406",
                                    "name": "S1 - Cours"
                              },
                              {
                                    "id": "year-407",
                                    "name": "S1 - TD"
                              },
                              {
                                    "id": "year-405",
                                    "name": "S2"
                              },
                              {
                                    "id": "year-408",
                                    "name": "S2 - Cours"
                              },
                              {
                                    "id": "year-409",
                                    "name": "S2 - TD"
                              }
                        ]
                  },
                  {
                        "id": "form-385",
                        "name": "Master",
                        "years": [
                              {
                                    "id": "year-410",
                                    "name": "Droit Public"
                              },
                              {
                                    "id": "year-414",
                                    "name": "Droit Public - Conseil et contentieux publics"
                              },
                              {
                                    "id": "year-416",
                                    "name": "Droit Public - Conseil et contentieux publics - S1"
                              },
                              {
                                    "id": "year-420",
                                    "name": "Droit Public - Conseil et contentieux publics - S1 - Cours"
                              },
                              {
                                    "id": "year-424",
                                    "name": "Droit Public - Conseil et contentieux publics - S1 - TD"
                              },
                              {
                                    "id": "year-417",
                                    "name": "Droit Public - Conseil et contentieux publics - S2"
                              },
                              {
                                    "id": "year-421",
                                    "name": "Droit Public - Conseil et contentieux publics - S2 - Cours"
                              },
                              {
                                    "id": "year-425",
                                    "name": "Droit Public - Conseil et contentieux publics - S2 - TD"
                              },
                              {
                                    "id": "year-418",
                                    "name": "Droit Public - Conseil et contentieux publics - S3"
                              },
                              {
                                    "id": "year-422",
                                    "name": "Droit Public - Conseil et contentieux publics - S3 - Cours"
                              },
                              {
                                    "id": "year-426",
                                    "name": "Droit Public - Conseil et contentieux publics - S3 - TD"
                              },
                              {
                                    "id": "year-419",
                                    "name": "Droit Public - Conseil et contentieux publics - S4"
                              },
                              {
                                    "id": "year-423",
                                    "name": "Droit Public - Conseil et contentieux publics - S4 - Cours"
                              },
                              {
                                    "id": "year-427",
                                    "name": "Droit Public - Conseil et contentieux publics - S4 - TD"
                              },
                              {
                                    "id": "year-415",
                                    "name": "Droit Public - Urbanisme et environnement"
                              },
                              {
                                    "id": "year-428",
                                    "name": "Droit Public - Urbanisme et environnement - S1"
                              },
                              {
                                    "id": "year-432",
                                    "name": "Droit Public - Urbanisme et environnement - S1 - Cours"
                              },
                              {
                                    "id": "year-436",
                                    "name": "Droit Public - Urbanisme et environnement - S1 - TD"
                              },
                              {
                                    "id": "year-429",
                                    "name": "Droit Public - Urbanisme et environnement - S2"
                              },
                              {
                                    "id": "year-433",
                                    "name": "Droit Public - Urbanisme et environnement - S2 - Cours"
                              },
                              {
                                    "id": "year-437",
                                    "name": "Droit Public - Urbanisme et environnement - S2 - TD"
                              },
                              {
                                    "id": "year-430",
                                    "name": "Droit Public - Urbanisme et environnement - S3"
                              },
                              {
                                    "id": "year-434",
                                    "name": "Droit Public - Urbanisme et environnement - S3 - Cours"
                              },
                              {
                                    "id": "year-438",
                                    "name": "Droit Public - Urbanisme et environnement - S3 - TD"
                              },
                              {
                                    "id": "year-431",
                                    "name": "Droit Public - Urbanisme et environnement - S4"
                              },
                              {
                                    "id": "year-435",
                                    "name": "Droit Public - Urbanisme et environnement - S4 - Cours"
                              },
                              {
                                    "id": "year-439",
                                    "name": "Droit Public - Urbanisme et environnement - S4 - TD"
                              },
                              {
                                    "id": "year-411",
                                    "name": "Justice Procès Procédures"
                              },
                              {
                                    "id": "year-440",
                                    "name": "Justice Procès Procédures - S1"
                              },
                              {
                                    "id": "year-452",
                                    "name": "Justice Procès Procédures - S1 - Cours"
                              },
                              {
                                    "id": "year-464",
                                    "name": "Justice Procès Procédures - S1 - TD"
                              },
                              {
                                    "id": "year-443",
                                    "name": "Justice Procès Procédures - S2"
                              },
                              {
                                    "id": "year-453",
                                    "name": "Justice Procès Procédures - S2 - Cours"
                              },
                              {
                                    "id": "year-465",
                                    "name": "Justice Procès Procédures - S2 - TD"
                              },
                              {
                                    "id": "year-446",
                                    "name": "Justice Procès Procédures - S3"
                              },
                              {
                                    "id": "year-454",
                                    "name": "Justice Procès Procédures - S3 - Cours"
                              },
                              {
                                    "id": "year-466",
                                    "name": "Justice Procès Procédures - S3 - TD"
                              },
                              {
                                    "id": "year-449",
                                    "name": "Justice Procès Procédures - S4"
                              },
                              {
                                    "id": "year-455",
                                    "name": "Justice Procès Procédures - S4 - Cours"
                              },
                              {
                                    "id": "year-467",
                                    "name": "Justice Procès Procédures - S4 - TD"
                              },
                              {
                                    "id": "year-412",
                                    "name": "Droit de l'entreprise"
                              },
                              {
                                    "id": "year-441",
                                    "name": "Droit de l'entreprise - S1"
                              },
                              {
                                    "id": "year-456",
                                    "name": "Droit de l'entreprise - S1 - Cours"
                              },
                              {
                                    "id": "year-468",
                                    "name": "Droit de l'entreprise - S1 - TD"
                              },
                              {
                                    "id": "year-444",
                                    "name": "Droit de l'entreprise - S2"
                              },
                              {
                                    "id": "year-457",
                                    "name": "Droit de l'entreprise - S2 - Cours"
                              },
                              {
                                    "id": "year-469",
                                    "name": "Droit de l'entreprise - S2 - TD"
                              },
                              {
                                    "id": "year-447",
                                    "name": "Droit de l'entreprise - S3"
                              },
                              {
                                    "id": "year-458",
                                    "name": "Droit de l'entreprise - S3 - Cours"
                              },
                              {
                                    "id": "year-470",
                                    "name": "Droit de l'entreprise - S3 - TD"
                              },
                              {
                                    "id": "year-450",
                                    "name": "Droit de l'entreprise - S4"
                              },
                              {
                                    "id": "year-459",
                                    "name": "Droit de l'entreprise - S4 - Cours"
                              },
                              {
                                    "id": "year-471",
                                    "name": "Droit de l'entreprise - S4 - TD"
                              },
                              {
                                    "id": "year-413",
                                    "name": "Droit des collectivités territoriales"
                              },
                              {
                                    "id": "year-442",
                                    "name": "Droit des collectivités territoriales - S1"
                              },
                              {
                                    "id": "year-460",
                                    "name": "Droit des collectivités territoriales - S1 - Cours"
                              },
                              {
                                    "id": "year-472",
                                    "name": "Droit des collectivités territoriales - S1 - TD"
                              },
                              {
                                    "id": "year-445",
                                    "name": "Droit des collectivités territoriales - S2"
                              },
                              {
                                    "id": "year-461",
                                    "name": "Droit des collectivités territoriales - S2 - Cours"
                              },
                              {
                                    "id": "year-473",
                                    "name": "Droit des collectivités territoriales - S2 - TD"
                              },
                              {
                                    "id": "year-448",
                                    "name": "Droit des collectivités territoriales - S3"
                              },
                              {
                                    "id": "year-462",
                                    "name": "Droit des collectivités territoriales - S3 - Cours"
                              },
                              {
                                    "id": "year-474",
                                    "name": "Droit des collectivités territoriales - S3 - TD"
                              },
                              {
                                    "id": "year-451",
                                    "name": "Droit des collectivités territoriales - S4"
                              },
                              {
                                    "id": "year-463",
                                    "name": "Droit des collectivités territoriales - S4 - Cours"
                              },
                              {
                                    "id": "year-475",
                                    "name": "Droit des collectivités territoriales - S4 - TD"
                              }
                        ]
                  }
            ]
      },
      {
            "id": "est-10",
            "name": "Lens - Faculté des Sciences",
            "formations": [
                  {
                        "id": "form-476",
                        "name": "Informations UFR"
                  },
                  {
                        "id": "form-559",
                        "name": "DU PARéo"
                  },
                  {
                        "id": "form-601",
                        "name": "PPPE",
                        "years": [
                              {
                                    "id": "year-602",
                                    "name": "L1"
                              },
                              {
                                    "id": "year-603",
                                    "name": "L2"
                              },
                              {
                                    "id": "year-604",
                                    "name": "L3"
                              }
                        ]
                  },
                  {
                        "id": "form-605",
                        "name": "PASS"
                  },
                  {
                        "id": "form-606",
                        "name": "Licences Professionnelles",
                        "years": [
                              {
                                    "id": "year-607",
                                    "name": "BGB"
                              },
                              {
                                    "id": "year-608",
                                    "name": "Environnement"
                              }
                        ]
                  },
                  {
                        "id": "form-609",
                        "name": "Licence & Master Chimie",
                        "years": [
                              {
                                    "id": "year-610",
                                    "name": "Licence"
                              },
                              {
                                    "id": "year-612",
                                    "name": "Licence - L1"
                              },
                              {
                                    "id": "year-613",
                                    "name": "Licence - L2"
                              },
                              {
                                    "id": "year-614",
                                    "name": "Licence - L3"
                              },
                              {
                                    "id": "year-611",
                                    "name": "Master"
                              },
                              {
                                    "id": "year-615",
                                    "name": "Master - M1"
                              },
                              {
                                    "id": "year-616",
                                    "name": "Master - M2"
                              }
                        ]
                  },
                  {
                        "id": "form-617",
                        "name": "Licence & Master Informatique",
                        "years": [
                              {
                                    "id": "year-618",
                                    "name": "Licence"
                              },
                              {
                                    "id": "year-620",
                                    "name": "Licence - L1"
                              },
                              {
                                    "id": "year-621",
                                    "name": "Licence - L2"
                              },
                              {
                                    "id": "year-622",
                                    "name": "Licence - L3"
                              },
                              {
                                    "id": "year-619",
                                    "name": "Master"
                              },
                              {
                                    "id": "year-623",
                                    "name": "Master - M1"
                              },
                              {
                                    "id": "year-624",
                                    "name": "Master - M2"
                              }
                        ]
                  },
                  {
                        "id": "form-625",
                        "name": "Licence & Master Mathématiques",
                        "years": [
                              {
                                    "id": "year-626",
                                    "name": "Licence"
                              },
                              {
                                    "id": "year-628",
                                    "name": "Licence - L1"
                              },
                              {
                                    "id": "year-629",
                                    "name": "Licence - L2"
                              },
                              {
                                    "id": "year-630",
                                    "name": "Licence - L3"
                              },
                              {
                                    "id": "year-627",
                                    "name": "Master"
                              },
                              {
                                    "id": "year-631",
                                    "name": "Master - M1"
                              },
                              {
                                    "id": "year-632",
                                    "name": "Master - M2"
                              }
                        ]
                  },
                  {
                        "id": "form-633",
                        "name": "Licence & Master Physique-Chimie",
                        "years": [
                              {
                                    "id": "year-634",
                                    "name": "Licence"
                              },
                              {
                                    "id": "year-636",
                                    "name": "Licence - L1"
                              },
                              {
                                    "id": "year-637",
                                    "name": "Licence - L2"
                              },
                              {
                                    "id": "year-638",
                                    "name": "Licence - L3"
                              },
                              {
                                    "id": "year-635",
                                    "name": "Master"
                              },
                              {
                                    "id": "year-639",
                                    "name": "Master - M1"
                              },
                              {
                                    "id": "year-640",
                                    "name": "Master - M2"
                              }
                        ]
                  },
                  {
                        "id": "form-641",
                        "name": "Licence & Masters Science de la vie",
                        "years": [
                              {
                                    "id": "year-642",
                                    "name": "Licence"
                              },
                              {
                                    "id": "year-644",
                                    "name": "Licence - L1"
                              },
                              {
                                    "id": "year-645",
                                    "name": "Licence - L2"
                              },
                              {
                                    "id": "year-646",
                                    "name": "Licence - L3"
                              },
                              {
                                    "id": "year-692",
                                    "name": "Licence - Prépa CAPES SVT"
                              },
                              {
                                    "id": "year-643",
                                    "name": "Master Toxicologie/Ecotox"
                              },
                              {
                                    "id": "year-647",
                                    "name": "Master Toxicologie/Ecotox - M1"
                              },
                              {
                                    "id": "year-648",
                                    "name": "Master Toxicologie/Ecotox - M2"
                              },
                              {
                                    "id": "year-649",
                                    "name": "Master AgroAlimentaire"
                              },
                              {
                                    "id": "year-650",
                                    "name": "Master AgroAlimentaire - M1"
                              },
                              {
                                    "id": "year-651",
                                    "name": "Master AgroAlimentaire - M2"
                              }
                        ]
                  },
                  {
                        "id": "form-652",
                        "name": "Anglais",
                        "years": [
                              {
                                    "id": "year-653",
                                    "name": "L1"
                              },
                              {
                                    "id": "year-654",
                                    "name": "L2"
                              },
                              {
                                    "id": "year-655",
                                    "name": "L3"
                              },
                              {
                                    "id": "year-656",
                                    "name": "Masters"
                              }
                        ]
                  }
            ]
      },
      {
            "id": "est-11",
            "name": "Lens - I.U.T. (Institut Universitaire de Technologie)",
            "formations": [
                  {
                        "id": "form-511",
                        "name": "FCU",
                        "years": [
                              {
                                    "id": "year-689",
                                    "name": "Evaluations"
                              }
                        ]
                  },
                  {
                        "id": "form-512",
                        "name": "GEA"
                  },
                  {
                        "id": "form-513",
                        "name": "Informatique",
                        "years": [
                              {
                                    "id": "year-514",
                                    "name": "DU Tremplin"
                              },
                              {
                                    "id": "year-515",
                                    "name": "BUT 1"
                              },
                              {
                                    "id": "year-516",
                                    "name": "BUT 1 - SAÉ S1"
                              },
                              {
                                    "id": "year-517",
                                    "name": "BUT 1 - SAÉ S2"
                              },
                              {
                                    "id": "year-518",
                                    "name": "BUT 2"
                              },
                              {
                                    "id": "year-557",
                                    "name": "BUT 3"
                              },
                              {
                                    "id": "year-520",
                                    "name": "Enseignements transversaux"
                              }
                        ]
                  },
                  {
                        "id": "form-521",
                        "name": "Médias numériques",
                        "years": [
                              {
                                    "id": "year-522",
                                    "name": "BUT 1"
                              },
                              {
                                    "id": "year-683",
                                    "name": "BUT 2"
                              },
                              {
                                    "id": "year-684",
                                    "name": "BUT 3"
                              }
                        ]
                  },
                  {
                        "id": "form-523",
                        "name": "Techniques de commercialisation"
                  },
                  {
                        "id": "form-524",
                        "name": "Enseignements transversaux"
                  }
            ]
      },
      {
            "id": "est-12",
            "name": "Liévin - Faculté des Sports et de l'Éducation Physique",
            "formations": [
                  {
                        "id": "form-537",
                        "name": "APS de spécialité"
                  },
                  {
                        "id": "form-538",
                        "name": "L1"
                  },
                  {
                        "id": "form-540",
                        "name": "L2-L3 APAS"
                  },
                  {
                        "id": "form-541",
                        "name": "L2-L3 EM"
                  },
                  {
                        "id": "form-542",
                        "name": "L2-L3 ES"
                  },
                  {
                        "id": "form-544",
                        "name": "Master MEEF EPS"
                  },
                  {
                        "id": "form-545",
                        "name": "Master PRS"
                  },
                  {
                        "id": "form-546",
                        "name": "Master SSAP"
                  },
                  {
                        "id": "form-547",
                        "name": "Enseignement transversaux - BQE"
                  },
                  {
                        "id": "form-693",
                        "name": "Espace ressources enseignant.e.s (réservé aux personnels)"
                  }
            ]
      },
      {
            "id": "est-13",
            "name": "Activités transversales",
            "formations": [
                  {
                        "id": "form-676",
                        "name": "Projet IFSEA"
                  }
            ]
      },
      {
            "id": "est-14",
            "name": "Cap Avenir - Orientation & Insertion Professionnelle"
      },
      {
            "id": "est-19",
            "name": "CEntre de Transformations et d'Innovations Pédagogiques"
      },
      {
            "id": "est-669",
            "name": "Bonus et Reconnaissance de l'Engagement Étudiant (R2E) à l''Université d'Artois"
      },
      {
            "id": "est-690",
            "name": "DRH - Formations",
            "formations": [
                  {
                        "id": "form-691",
                        "name": "Formations Chaires de professeurs juniors"
                  }
            ]
      },
      {
            "id": "est-15",
            "name": "FCU Artois",
            "formations": [
                  {
                        "id": "form-548",
                        "name": "DAEU B"
                  },
                  {
                        "id": "form-549",
                        "name": "DU Chinois"
                  }
            ]
      },
      {
            "id": "est-17",
            "name": "PIX",
            "formations": [
                  {
                        "id": "form-659",
                        "name": "Autoformation Pix",
                        "years": [
                              {
                                    "id": "year-661",
                                    "name": "Culture Numérique"
                              },
                              {
                                    "id": "year-662",
                                    "name": "Compétences numériques"
                              }
                        ]
                  },
                  {
                        "id": "form-660",
                        "name": "Cours Pix spécifiques aux formations"
                  }
            ]
      },
      {
            "id": "est-555",
            "name": "Renfort-Parcoursup"
      },
      {
            "id": "est-18",
            "name": "Service Artois Sport Campus"
      },
      {
            "id": "est-20",
            "name": "Service Vie Etudiante"
      },
      {
            "id": "est-679",
            "name": "Outils - Formations"
      },
      {
            "id": "est-1",
            "name": "Tests"
      },
      {
            "id": "est-694",
            "name": "A supprimer"
      }
    ]
  }
];
