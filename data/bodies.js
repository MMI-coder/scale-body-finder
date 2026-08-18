/**
 * data/bodies.js - GENERATED, do not edit by hand.
 * Source: data/bodies.csv   Rebuild: node tools/build-body-data.js
 *
 * Measurements are millimetres. null means the figure isn't known, and the UI
 * shows a dash rather than inventing one.
 *
 *
 * heightsByHead gives the total height for each of the three custom head
 * sculpts, keyed by head size in mm. Only the size in headSize was actually
 * measured; the others are that measurement shifted by the difference in head
 * height, which is 1:1 because the peg socket depth doesn't change. Bodies
 * shipped with a manufacturer head have headSize null and heightsByHead null.
 */

export const HEAD_SIZES = [37.5,38,38.5]

const IMAGES = {
  "86Toys 86-TS01-A.jpg": require("../images/86Toys 86-TS01-A.jpg"),
  "Longshan LSJS-TS01.jpg": require("../images/Longshan LSJS-TS01.jpg"),
  "N-1A.jpg": require("../images/N-1A.jpg"),
  "S07 Family.jpg": require("../images/S07 Family.jpg"),
  "S10 Family.jpg": require("../images/S10 Family.jpg"),
  "S16 Family.jpg": require("../images/S16 Family.jpg"),
  "S20 Family.jpg": require("../images/S20 Family.jpg"),
  "S22 Family.jpg": require("../images/S22 Family.jpg"),
  "S24 Family.jpg": require("../images/S24 Family.jpg"),
  "S38 Family.jpg": require("../images/S38 Family.jpg"),
  "S42 Family.jpg": require("../images/S42 Family.jpg"),
  "S44 Family.jpg": require("../images/S44 Family.jpg"),
  "S48 Family.jpg": require("../images/S48 Family.jpg"),
  "S52 Family.jpg": require("../images/S52 Family.jpg"),
  "TBLeague SR-AD01.jpg": require("../images/TBLeague SR-AD01.jpg"),
  "TBLeague SR-BD01.jpg": require("../images/TBLeague SR-BD01.jpg"),
  "TBLeague SR-CD01.jpg": require("../images/TBLeague SR-CD01.jpg"),
  "TBLeague SR-DD01.jpg": require("../images/TBLeague SR-DD01.jpg"),
  "TBLeague TB-DF01.jpg": require("../images/TBLeague TB-DF01.jpg"),
  "VeryCool VCD-01.jpg": require("../images/VeryCool VCD-01.jpg"),
  "VeryCool VCD-02.jpg": require("../images/VeryCool VCD-02.jpg"),
  "VeryCool VCD-03.jpg": require("../images/VeryCool VCD-03.jpg"),
  "VeryCool VCD-05.jpg": require("../images/VeryCool VCD-05.jpg"),
  "VeryCool VCD-06.jpg": require("../images/VeryCool VCD-06.jpg"),
  "VeryCool VCD-07.jpg": require("../images/VeryCool VCD-07.jpg"),
  "WorldBox AT-201.jpg": require("../images/WorldBox AT-201.jpg"),
  "WorldBox AT-203.jpg": require("../images/WorldBox AT-203.jpg"),
  "WorldBox AT-206.jpg": require("../images/WorldBox AT-206.jpg"),
}

/** Resolve a CSV image filename to a bundled asset, or null. */
export function bodyImage(filename) {
  return filename ? IMAGES[filename] ?? null : null
}

export const BODIES = [
  {
    "code": "S07C",
    "name": "S07C",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 260,
    "pegMax": 266,
    "pegMfr": null,
    "head": "Custom 38mm 3D Print",
    "heightMin": 274,
    "heightMax": 280,
    "bust": 153,
    "underbust": 106,
    "waist": 93,
    "hips": 143,
    "shoulder": 67,
    "arm": 92,
    "inseam": 128,
    "feet": "Attached",
    "image": "S07 Family.jpg",
    "notes": "Model line includes: S07C, S07D, S09C and S09D",
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 274,
        "max": 280
      },
      "37.5": {
        "min": 273.5,
        "max": 279.5
      },
      "38.5": {
        "min": 274.5,
        "max": 280.5
      }
    },
    "imageW": 3839,
    "imageH": 1961
  },
  {
    "code": "S10D",
    "name": "S10D",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 262,
    "pegMax": 268,
    "pegMfr": null,
    "head": "Custom 38mm 3D Print",
    "heightMin": 277,
    "heightMax": 283,
    "bust": 145,
    "underbust": 106,
    "waist": 92,
    "hips": 147,
    "shoulder": 67,
    "arm": 90,
    "inseam": 129,
    "feet": "Removable",
    "image": "S10 Family.jpg",
    "notes": "Model line includes: S10D, S10E, S12D and S12E",
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 277,
        "max": 283
      },
      "37.5": {
        "min": 276.5,
        "max": 282.5
      },
      "38.5": {
        "min": 277.5,
        "max": 283.5
      }
    },
    "imageW": 3835,
    "imageH": 1970
  },
  {
    "code": "S16A",
    "name": "S16A",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 265,
    "pegMax": 268,
    "pegMfr": null,
    "head": "Custom 38mm 3D Print",
    "heightMin": 280,
    "heightMax": 283,
    "bust": 136,
    "underbust": 108,
    "waist": 94,
    "hips": 140,
    "shoulder": 62,
    "arm": 90,
    "inseam": 130,
    "feet": "Removable",
    "image": "S16 Family.jpg",
    "notes": "Model line includes: S16A, S16B, S17B, and S17C",
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 280,
        "max": 283
      },
      "37.5": {
        "min": 279.5,
        "max": 282.5
      },
      "38.5": {
        "min": 280.5,
        "max": 283.5
      }
    },
    "imageW": 3839,
    "imageH": 1969
  },
  {
    "code": "S20A",
    "name": "S20A",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 264,
    "pegMax": 268,
    "pegMfr": null,
    "head": "Custom 38mm 3D Print",
    "heightMin": 280,
    "heightMax": 284,
    "bust": 163,
    "underbust": 123,
    "waist": 91,
    "hips": 140,
    "shoulder": 68,
    "arm": 88,
    "inseam": 130,
    "feet": "Removable",
    "image": "S20 Family.jpg",
    "notes": "Model line includes: S20A, S20B, S21B, and S21C",
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 280,
        "max": 284
      },
      "37.5": {
        "min": 279.5,
        "max": 283.5
      },
      "38.5": {
        "min": 280.5,
        "max": 284.5
      }
    },
    "imageW": 3839,
    "imageH": 1968
  },
  {
    "code": "S22A",
    "name": "S22A",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 262,
    "pegMax": 268,
    "pegMfr": null,
    "head": "Custom 38mm 3D Print",
    "heightMin": 278,
    "heightMax": 282,
    "bust": 146,
    "underbust": 114,
    "waist": 95,
    "hips": 140,
    "shoulder": 70,
    "arm": 95,
    "inseam": 130,
    "feet": "Removable",
    "image": "S22 Family.jpg",
    "notes": "Model line includes: S22A, S22B, S23B, and S23C",
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 278,
        "max": 282
      },
      "37.5": {
        "min": 277.5,
        "max": 281.5
      },
      "38.5": {
        "min": 278.5,
        "max": 282.5
      }
    },
    "imageW": 3839,
    "imageH": 1965
  },
  {
    "code": "S24A",
    "name": "S24A",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 245,
    "pegMax": 250,
    "pegMfr": null,
    "head": "Custom 37.5mm 3D Print",
    "heightMin": 262,
    "heightMax": 267,
    "bust": 136,
    "underbust": 104,
    "waist": 84,
    "hips": 125,
    "shoulder": 58,
    "arm": 80,
    "inseam": 124,
    "feet": "Removable",
    "image": "S24 Family.jpg",
    "notes": "Model line includes: S24A, S24B, S25B, and S25C",
    "headSize": 37.5,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 262.5,
        "max": 267.5
      },
      "37.5": {
        "min": 262,
        "max": 267
      },
      "38.5": {
        "min": 263,
        "max": 268
      }
    },
    "imageW": 3839,
    "imageH": 1967
  },
  {
    "code": "S38A",
    "name": "S38A",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 246,
    "pegMax": 252,
    "pegMfr": null,
    "head": "Custom 38.5mm 3D Print",
    "heightMin": 264,
    "heightMax": 270,
    "bust": 163,
    "underbust": 117,
    "waist": 107,
    "hips": 160,
    "shoulder": 70,
    "arm": 80,
    "inseam": 122,
    "feet": "Removable",
    "image": "S38 Family.jpg",
    "notes": "Model line includes: S38A, S38B, S39A, and S39B",
    "headSize": 38.5,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 263.5,
        "max": 269.5
      },
      "37.5": {
        "min": 263,
        "max": 269
      },
      "38.5": {
        "min": 264,
        "max": 270
      }
    },
    "imageW": 3839,
    "imageH": 1971
  },
  {
    "code": "S42A",
    "name": "S42A",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 272,
    "pegMax": 278,
    "pegMfr": null,
    "head": "Custom 38.5mm 3D Print",
    "heightMin": 292,
    "heightMax": 298,
    "bust": 160,
    "underbust": 120,
    "waist": 93,
    "hips": 158,
    "shoulder": 62,
    "arm": 90,
    "inseam": 140,
    "feet": "Attached",
    "image": "S42 Family.jpg",
    "notes": "Model line includes: S42A, S42B, S43A, and S43B",
    "headSize": 38.5,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 291.5,
        "max": 297.5
      },
      "37.5": {
        "min": 291,
        "max": 297
      },
      "38.5": {
        "min": 292,
        "max": 298
      }
    },
    "imageW": 3839,
    "imageH": 1970
  },
  {
    "code": "S44A",
    "name": "S44A",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 245,
    "pegMax": 253,
    "pegMfr": null,
    "head": "Custom 37.5mm 3D Print",
    "heightMin": 260,
    "heightMax": 268,
    "bust": 113,
    "underbust": 96,
    "waist": 74,
    "hips": 124,
    "shoulder": 52,
    "arm": 75,
    "inseam": 125,
    "feet": "Removable",
    "image": "S44 Family.jpg",
    "notes": "Model line includes: S44A, S44B, S45A, and S45B",
    "headSize": 37.5,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 260.5,
        "max": 268.5
      },
      "37.5": {
        "min": 260,
        "max": 268
      },
      "38.5": {
        "min": 261,
        "max": 269
      }
    },
    "imageW": 3839,
    "imageH": 1964
  },
  {
    "code": "S48A",
    "name": "S48A",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 262,
    "pegMax": 268,
    "pegMfr": null,
    "head": "Custom 37.5mm 3D Print",
    "heightMin": 278,
    "heightMax": 284,
    "bust": 137,
    "underbust": 103,
    "waist": 93,
    "hips": 142,
    "shoulder": 54,
    "arm": 74,
    "inseam": 130,
    "feet": "Removable",
    "image": "S48 Family.jpg",
    "notes": "Model line includes: S48A, S48B, S49A, and S49B",
    "headSize": 37.5,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 278.5,
        "max": 284.5
      },
      "37.5": {
        "min": 278,
        "max": 284
      },
      "38.5": {
        "min": 279,
        "max": 285
      }
    },
    "imageW": 3839,
    "imageH": 1968
  },
  {
    "code": "S52A",
    "name": "S52A",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 272,
    "pegMax": 278,
    "pegMfr": null,
    "head": "Custom 38.5mm 3D Print",
    "heightMin": 292,
    "heightMax": 298,
    "bust": 160,
    "underbust": 120,
    "waist": 93,
    "hips": 158,
    "shoulder": 62,
    "arm": 90,
    "inseam": 140,
    "feet": "Removable",
    "image": "S52 Family.jpg",
    "notes": "Model line includes: S52A, S52B, S53A, and S53B",
    "headSize": 38.5,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 291.5,
        "max": 297.5
      },
      "37.5": {
        "min": 291,
        "max": 297
      },
      "38.5": {
        "min": 292,
        "max": 298
      }
    },
    "imageW": 3839,
    "imageH": 1967
  },
  {
    "code": "SR-AD01",
    "name": "SR-AD01",
    "manufacturer": "TBLeague",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 280,
    "head": "Manufacturer",
    "heightMin": 306,
    "heightMax": 310,
    "bust": 160,
    "underbust": null,
    "waist": 105,
    "hips": 169,
    "shoulder": null,
    "arm": null,
    "inseam": null,
    "feet": "Removable",
    "image": "TBLeague SR-AD01.jpg",
    "notes": "There are versions where a head sculpt is included. It adds \"(H)\" to the Product Name/Code",
    "headSize": null,
    "heightSource": "manufacturer",
    "manufacturerHeight": 310,
    "heightsByHead": null,
    "imageW": 1200,
    "imageH": 1800
  },
  {
    "code": "SR-BD01",
    "name": "SR-BD01",
    "manufacturer": "TBLeague",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 273,
    "head": "Manufacturer",
    "heightMin": 291,
    "heightMax": 295,
    "bust": 150,
    "underbust": null,
    "waist": 95,
    "hips": 178,
    "shoulder": 62,
    "arm": 85,
    "inseam": 150,
    "feet": "Removable",
    "image": "TBLeague SR-BD01.jpg",
    "notes": "There are versions where a head sculpt is included. It adds \"(H)\" to the Product Name/Code",
    "headSize": null,
    "heightSource": "manufacturer",
    "manufacturerHeight": 295,
    "heightsByHead": null,
    "imageW": 1200,
    "imageH": 1600
  },
  {
    "code": "SR-CD01",
    "name": "SR-CD01",
    "manufacturer": "TBLeague",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 265,
    "head": "Manufacturer",
    "heightMin": 279,
    "heightMax": 283,
    "bust": 150,
    "underbust": null,
    "waist": 95,
    "hips": 164,
    "shoulder": 58,
    "arm": 85,
    "inseam": 150,
    "feet": "Removable",
    "image": "TBLeague SR-CD01.jpg",
    "notes": "There are versions where a head sculpt is included. It adds \"(H)\" to the Product Name/Code",
    "headSize": null,
    "heightSource": "manufacturer",
    "manufacturerHeight": 283,
    "heightsByHead": null,
    "imageW": 1200,
    "imageH": 1600
  },
  {
    "code": "SR-DD01",
    "name": "SR-DD01",
    "manufacturer": "TBLeague",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 265,
    "head": "Manufacturer",
    "heightMin": 279,
    "heightMax": 283,
    "bust": 156,
    "underbust": null,
    "waist": 97,
    "hips": 170,
    "shoulder": 58,
    "arm": 85,
    "inseam": 150,
    "feet": "Removable",
    "image": "TBLeague SR-DD01.jpg",
    "notes": "There are versions where a head sculpt is included. It adds \"(H)\" to the Product Name/Code",
    "headSize": null,
    "heightSource": "manufacturer",
    "manufacturerHeight": 283,
    "heightsByHead": null,
    "imageW": 1200,
    "imageH": 1600
  },
  {
    "code": "TB-DF01",
    "name": "TB-DF01",
    "manufacturer": "TBLeague",
    "material": "TPE",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 270,
    "head": "Manufacturer",
    "heightMin": 291,
    "heightMax": 295,
    "bust": 150,
    "underbust": null,
    "waist": 97,
    "hips": 165,
    "shoulder": null,
    "arm": null,
    "inseam": null,
    "feet": "Removable",
    "image": "TBLeague TB-DF01.jpg",
    "notes": "There are versions where a head sculpt is included. It adds \"(H)\" to the Product Name/Code",
    "headSize": null,
    "heightSource": "manufacturer",
    "manufacturerHeight": 295,
    "heightsByHead": null,
    "imageW": 1500,
    "imageH": 2250
  },
  {
    "code": "N-1A",
    "name": "N-1A",
    "manufacturer": "Novan Studio",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 275,
    "head": "Manufacturer",
    "heightMin": 285,
    "heightMax": 285,
    "bust": 160,
    "underbust": null,
    "waist": 110,
    "hips": 170,
    "shoulder": 60,
    "arm": null,
    "inseam": null,
    "feet": "Attached",
    "image": "N-1A.jpg",
    "notes": null,
    "headSize": null,
    "heightSource": "manufacturer",
    "manufacturerHeight": 285,
    "heightsByHead": null,
    "imageW": 1200,
    "imageH": 1600
  },
  {
    "code": "VCD-01",
    "name": "VCD-01",
    "manufacturer": "VeryCool",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 260,
    "head": null,
    "heightMin": null,
    "heightMax": null,
    "bust": 140,
    "underbust": null,
    "waist": 88,
    "hips": 152,
    "shoulder": 64,
    "arm": 90,
    "inseam": 152,
    "feet": "Removable",
    "image": "VeryCool VCD-01.jpg",
    "notes": null,
    "headSize": 38,
    "heightSource": "estimated",
    "heightsByHead": {
      "38": {
        "min": 274,
        "max": 280
      },
      "37.5": {
        "min": 273.5,
        "max": 279.5
      },
      "38.5": {
        "min": 274.5,
        "max": 280.5
      }
    },
    "imageW": 1500,
    "imageH": 2304,
    "heightEstimatedFrom": "S07C",
    "manufacturerHeight": null
  },
  {
    "code": "VCD-02",
    "name": "VCD-02",
    "manufacturer": "VeryCool",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 260,
    "head": null,
    "heightMin": null,
    "heightMax": null,
    "bust": 138,
    "underbust": null,
    "waist": 90,
    "hips": 152,
    "shoulder": 64,
    "arm": 90,
    "inseam": 148,
    "feet": "Removable",
    "image": "VeryCool VCD-02.jpg",
    "notes": null,
    "headSize": 38,
    "heightSource": "estimated",
    "heightsByHead": {
      "38": {
        "min": 274,
        "max": 280
      },
      "37.5": {
        "min": 273.5,
        "max": 279.5
      },
      "38.5": {
        "min": 274.5,
        "max": 280.5
      }
    },
    "imageW": 1500,
    "imageH": 2304,
    "heightEstimatedFrom": "S07C",
    "manufacturerHeight": null
  },
  {
    "code": "VCD-03",
    "name": "VCD-03",
    "manufacturer": "VeryCool",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 262,
    "pegMax": 270,
    "pegMfr": 260,
    "head": "Custom 38mm 3D Print",
    "heightMin": 278,
    "heightMax": 284,
    "bust": 153,
    "underbust": 98,
    "waist": 86,
    "hips": 170,
    "shoulder": 60,
    "arm": 95,
    "inseam": 138,
    "feet": "Removable",
    "image": "VeryCool VCD-03.jpg",
    "notes": null,
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 278,
        "max": 284
      },
      "37.5": {
        "min": 277.5,
        "max": 283.5
      },
      "38.5": {
        "min": 278.5,
        "max": 284.5
      }
    },
    "imageW": 1500,
    "imageH": 2304
  },
  {
    "code": "VCD-05",
    "name": "VCD-05",
    "manufacturer": "VeryCool",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": 268,
    "pegMax": 274,
    "pegMfr": 260,
    "head": "Custom 38mm 3D Print",
    "heightMin": 284,
    "heightMax": 290,
    "bust": 146,
    "underbust": 110,
    "waist": 91,
    "hips": 145,
    "shoulder": 65,
    "arm": 95,
    "inseam": 135,
    "feet": "Removable",
    "image": "VeryCool VCD-05.jpg",
    "notes": null,
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 284,
        "max": 290
      },
      "37.5": {
        "min": 283.5,
        "max": 289.5
      },
      "38.5": {
        "min": 284.5,
        "max": 290.5
      }
    },
    "imageW": 2266,
    "imageH": 1697
  },
  {
    "code": "VCD-06",
    "name": "VCD-06",
    "manufacturer": "VeryCool",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 260,
    "head": null,
    "heightMin": null,
    "heightMax": null,
    "bust": 150,
    "underbust": null,
    "waist": 80,
    "hips": 145,
    "shoulder": 55,
    "arm": 90,
    "inseam": 150,
    "feet": "Attached",
    "image": "VeryCool VCD-06.jpg",
    "notes": "This is an attached foot version of the VCD-07",
    "headSize": 38,
    "heightSource": "estimated",
    "heightsByHead": {
      "38": {
        "min": 274,
        "max": 280
      },
      "37.5": {
        "min": 273.5,
        "max": 279.5
      },
      "38.5": {
        "min": 274.5,
        "max": 280.5
      }
    },
    "imageW": 1134,
    "imageH": 1701,
    "heightEstimatedFrom": "S07C",
    "manufacturerHeight": null
  },
  {
    "code": "VCD-07",
    "name": "VCD-07",
    "manufacturer": "VeryCool",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 260,
    "head": null,
    "heightMin": null,
    "heightMax": null,
    "bust": 150,
    "underbust": null,
    "waist": 80,
    "hips": 145,
    "shoulder": 55,
    "arm": 90,
    "inseam": 150,
    "feet": "Removable",
    "image": "VeryCool VCD-07.jpg",
    "notes": "This is a detachable foot version of the VCD-06",
    "headSize": 38,
    "heightSource": "estimated",
    "heightsByHead": {
      "38": {
        "min": 274,
        "max": 280
      },
      "37.5": {
        "min": 273.5,
        "max": 279.5
      },
      "38.5": {
        "min": 274.5,
        "max": 280.5
      }
    },
    "imageW": 2998,
    "imageH": 2233,
    "heightEstimatedFrom": "S07C",
    "manufacturerHeight": null
  },
  {
    "code": "LSJS-TS01",
    "name": "LSJS-TS01",
    "manufacturer": "Longshan",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 270,
    "head": null,
    "heightMin": null,
    "heightMax": null,
    "bust": 140,
    "underbust": null,
    "waist": 90,
    "hips": 175,
    "shoulder": 60,
    "arm": 85,
    "inseam": 145,
    "feet": "Removable",
    "image": "Longshan LSJS-TS01.jpg",
    "notes": "Longshan's own product image is labelled LSJS-ST01; the product code is LSJS-TS01.",
    "headSize": null,
    "heightSource": null,
    "heightsByHead": null,
    "imageW": 1500,
    "imageH": 1500
  },
  {
    "code": "86-TS01-A",
    "name": "86-TS01-A",
    "manufacturer": "86Toys",
    "material": "Silicone",
    "bodyType": "Seamless",
    "bustPiece": null,
    "pegMin": null,
    "pegMax": null,
    "pegMfr": 265,
    "head": null,
    "heightMin": null,
    "heightMax": 280,
    "bust": 124,
    "underbust": null,
    "waist": 84,
    "hips": 150,
    "shoulder": null,
    "arm": 76,
    "inseam": 144,
    "feet": "Removable",
    "image": "86Toys 86-TS01-A.jpg",
    "notes": null,
    "headSize": null,
    "heightSource": "manufacturer",
    "manufacturerHeight": 280,
    "heightsByHead": null,
    "imageW": 1500,
    "imageH": 1500
  },
  {
    "code": "AT-201",
    "name": "AT-201",
    "manufacturer": "WorldBox",
    "material": "Plastic",
    "bodyType": "Jointed",
    "bustPiece": null,
    "pegMin": 248,
    "pegMax": 248,
    "pegMfr": 248,
    "head": "Custom 38mm 3D Print",
    "heightMin": 266,
    "heightMax": 266,
    "bust": null,
    "underbust": null,
    "waist": 98,
    "hips": 156,
    "shoulder": 66,
    "arm": 86,
    "inseam": 115,
    "feet": "Removable",
    "image": "WorldBox AT-201.jpg",
    "notes": "WorldBox bodies are modular. Height is fixed. Fitting legs from another AT-series body changes it, across a 266-274mm span.",
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 266,
        "max": 266
      },
      "37.5": {
        "min": 265.5,
        "max": 265.5
      },
      "38.5": {
        "min": 266.5,
        "max": 266.5
      }
    },
    "imageW": 850,
    "imageH": 1378,
    "bustOptions": [
      {
        "piece": "A-cup",
        "bust": 128
      },
      {
        "piece": "C-cup",
        "bust": 140
      },
      {
        "piece": "D-cup",
        "bust": 145
      },
      {
        "piece": "E-cup",
        "bust": 155
      },
      {
        "piece": "G-cup",
        "bust": 185
      }
    ]
  },
  {
    "code": "AT-203",
    "name": "AT-203",
    "manufacturer": "WorldBox",
    "material": "Plastic",
    "bodyType": "Jointed",
    "bustPiece": null,
    "pegMin": 256,
    "pegMax": 256,
    "pegMfr": 256,
    "head": "Custom 38mm 3D Print",
    "heightMin": 274,
    "heightMax": 274,
    "bust": null,
    "underbust": null,
    "waist": 98,
    "hips": 156,
    "shoulder": 66,
    "arm": 86,
    "inseam": 125,
    "feet": "Removable",
    "image": "WorldBox AT-203.jpg",
    "notes": "WorldBox bodies are modular. Height is fixed. Fitting legs from another AT-series body changes it, across a 266-274mm span.",
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 274,
        "max": 274
      },
      "37.5": {
        "min": 273.5,
        "max": 273.5
      },
      "38.5": {
        "min": 274.5,
        "max": 274.5
      }
    },
    "imageW": 750,
    "imageH": 1216,
    "bustOptions": [
      {
        "piece": "A-cup",
        "bust": 128
      },
      {
        "piece": "C-cup",
        "bust": 140
      },
      {
        "piece": "D-cup",
        "bust": 145
      },
      {
        "piece": "E-cup",
        "bust": 155
      },
      {
        "piece": "G-cup",
        "bust": 185
      }
    ]
  },
  {
    "code": "AT-206",
    "name": "AT-206",
    "manufacturer": "WorldBox",
    "material": "Plastic",
    "bodyType": "Jointed",
    "bustPiece": null,
    "pegMin": 248,
    "pegMax": 248,
    "pegMfr": 248,
    "head": "Custom 38mm 3D Print",
    "heightMin": 266,
    "heightMax": 266,
    "bust": null,
    "underbust": null,
    "waist": 98,
    "hips": 160,
    "shoulder": 72,
    "arm": 86,
    "inseam": 115,
    "feet": "Removable",
    "image": "WorldBox AT-206.jpg",
    "notes": "WorldBox bodies are modular. Height is fixed. Fitting legs from another AT-series body changes it, across a 266-274mm span.",
    "headSize": 38,
    "heightSource": "measured",
    "heightsByHead": {
      "38": {
        "min": 266,
        "max": 266
      },
      "37.5": {
        "min": 265.5,
        "max": 265.5
      },
      "38.5": {
        "min": 266.5,
        "max": 266.5
      }
    },
    "imageW": 900,
    "imageH": 1200,
    "bustOptions": [
      {
        "piece": "A-cup",
        "bust": 128
      },
      {
        "piece": "C-cup",
        "bust": 140
      },
      {
        "piece": "D-cup",
        "bust": 145
      },
      {
        "piece": "E-cup",
        "bust": 155
      },
      {
        "piece": "G-cup",
        "bust": 185
      }
    ]
  }
]

export default BODIES
