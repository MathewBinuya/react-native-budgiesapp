import { View, Animated, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";

const C = {
  egg: "#FFF3DC",
  eggShadow: "#EDD89A",
  body: "#88BF7A",
  bodyDark: "#5A9B48",
  belly: "#EFF5D6",
  chick: "#FECE2F",
  chickDark: "#E8B520",
  chickBelly: "#FFFAD0",
  beak: "#F5A623",
  eye: "#1A0F08",
  eyeShine: "rgba(255,255,255,0.9)",
  cheekHappy: "#F9A8C9",
  cheekContent: "#F0C090",
  cheekSad: "#B5BDC8",
};

// ─── Egg ─────────────────────────────────────────────────────────────────────
function Egg({ breathe }) {
  return (
    <Animated.View style={{ transform: [{ scale: breathe }] }}>
      <View style={s.egg}>
        <View style={s.eggGlow} />
        <View style={s.eggShine} />
      </View>
    </Animated.View>
  );
}

// ─── Chick ───────────────────────────────────────────────────────────────────
function Chick({ breathe, blink }) {
  return (
    <Animated.View style={[s.sprite, { transform: [{ scale: breathe }] }]}>
      <View style={[s.chickWing, s.chickWingL]} />
      <View style={[s.chickWing, s.chickWingR]} />
      <View style={s.chickBody}>
        <View style={s.chickBelly} />
      </View>
      <View style={s.chickHead}>
        <Animated.View style={[s.eye, s.eyeL, { transform: [{ scaleY: blink }] }]}>
          <View style={s.eyeShine} />
        </Animated.View>
        <Animated.View style={[s.eye, s.eyeR, { transform: [{ scaleY: blink }] }]}>
          <View style={s.eyeShine} />
        </Animated.View>
        <View style={s.chickBeak} />
      </View>
    </Animated.View>
  );
}

// ─── Budgie ──────────────────────────────────────────────────────────────────
function Budgie({ breathe, blink, mood }) {
  const cheekColor =
    mood === "happy"
      ? C.cheekHappy
      : mood === "content"
      ? C.cheekContent
      : C.cheekSad;

  return (
    <Animated.View style={[s.sprite, { transform: [{ scale: breathe }] }]}>
      <View style={s.tail} />
      <View style={[s.wing, s.wingL]} />
      <View style={[s.wing, s.wingR]} />
      <View style={s.budgieBody}>
        <View style={s.budgieBelly} />
      </View>
      <View style={s.budgieHead}>
        <View style={s.tuftC} />
        <View style={[s.tuft, s.tuftL]} />
        <View style={[s.tuft, s.tuftR]} />
        <Animated.View style={[s.eyeLg, s.eyeLgL, { transform: [{ scaleY: blink }] }]}>
          <View style={s.eyeShine} />
        </Animated.View>
        <Animated.View style={[s.eyeLg, s.eyeLgR, { transform: [{ scaleY: blink }] }]}>
          <View style={s.eyeShine} />
        </Animated.View>
        <View style={[s.cheek, s.cheekL, { backgroundColor: cheekColor }]} />
        <View style={[s.cheek, s.cheekR, { backgroundColor: cheekColor }]} />
        <View style={s.budgieBeak} />
      </View>
    </Animated.View>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function MochiSprite({ stage = "egg", mood = "content" }) {
  const breathe = useRef(new Animated.Value(1)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const blinkTimer = useRef(null);

  useEffect(() => {
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.05, duration: 1600, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1.0, duration: 1600, useNativeDriver: true }),
      ])
    );
    breatheLoop.start();

    const scheduleBlink = () => {
      blinkTimer.current = setTimeout(() => {
        Animated.sequence([
          Animated.timing(blink, { toValue: 0.08, duration: 60, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start(() => scheduleBlink());
      }, 2200 + Math.random() * 2800);
    };
    scheduleBlink();

    return () => {
      breatheLoop.stop();
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, []);

  if (stage === "egg") return <Egg breathe={breathe} />;
  if (stage === "chick") return <Chick breathe={breathe} blink={blink} />;
  return <Budgie breathe={breathe} blink={blink} mood={mood} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  sprite: {
    width: 130,
    height: 145,
  },

  // Egg
  egg: {
    width: 96,
    height: 118,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderBottomLeftRadius: 46,
    borderBottomRightRadius: 46,
    backgroundColor: C.egg,
    overflow: "hidden",
    shadowColor: C.eggShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  eggGlow: {
    position: "absolute",
    width: 64,
    height: 84,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: C.eggShadow,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  eggShine: {
    position: "absolute",
    width: 22,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.72)",
    top: 14,
    left: 15,
    transform: [{ rotate: "-18deg" }],
  },

  // Chick — absolute-positioned parts inside 130×145 canvas
  chickHead: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.chick,
    top: 0,
    left: 35,
  },
  chickBody: {
    position: "absolute",
    width: 74,
    height: 64,
    borderRadius: 37,
    backgroundColor: C.chick,
    bottom: 18,
    left: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  chickBelly: {
    width: 48,
    height: 44,
    borderRadius: 24,
    backgroundColor: C.chickBelly,
  },
  chickWing: {
    position: "absolute",
    width: 26,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.chickDark,
  },
  chickWingL: {
    left: 6,
    bottom: 20,
    transform: [{ rotate: "14deg" }],
  },
  chickWingR: {
    right: 6,
    bottom: 20,
    transform: [{ rotate: "-14deg" }],
  },

  // Eyes — chick (small)
  eye: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.eye,
  },
  eyeL: { top: 22, left: 11 },
  eyeR: { top: 22, right: 11 },

  eyeShine: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.eyeShine,
    position: "absolute",
    top: 1,
    left: 1,
  },

  // Beak — downward triangle
  chickBeak: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: C.beak,
    top: 37,
    left: 23,
  },

  // Budgie
  budgieHead: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: C.body,
    top: 0,
    left: 34,
  },
  budgieBody: {
    position: "absolute",
    width: 72,
    height: 82,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: C.body,
    bottom: 10,
    left: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  budgieBelly: {
    width: 44,
    height: 58,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: C.belly,
  },
  wing: {
    position: "absolute",
    width: 36,
    height: 68,
    backgroundColor: C.bodyDark,
  },
  wingL: {
    left: 0,
    bottom: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 20,
    transform: [{ rotate: "8deg" }],
  },
  wingR: {
    right: 0,
    bottom: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 14,
    transform: [{ rotate: "-8deg" }],
  },
  tail: {
    position: "absolute",
    width: 22,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.bodyDark,
    bottom: 0,
    left: 54,
  },

  // Tuft (head feathers)
  tuftC: {
    position: "absolute",
    width: 10,
    height: 18,
    borderRadius: 5,
    backgroundColor: C.bodyDark,
    top: -10,
    left: 26,
  },
  tuft: {
    position: "absolute",
    width: 8,
    height: 14,
    borderRadius: 4,
    backgroundColor: C.body,
    top: -6,
  },
  tuftL: { left: 14 },
  tuftR: { left: 40 },

  // Eyes — budgie (larger)
  eyeLg: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.eye,
  },
  eyeLgL: { top: 22, left: 9 },
  eyeLgR: { top: 22, right: 9 },

  // Cheek patches
  cheek: {
    position: "absolute",
    width: 16,
    height: 10,
    borderRadius: 8,
    opacity: 0.8,
    top: 36,
  },
  cheekL: { left: 4 },
  cheekR: { right: 4 },

  // Budgie beak (rounded hooked shape)
  budgieBeak: {
    position: "absolute",
    width: 14,
    height: 10,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 7,
    backgroundColor: C.beak,
    top: 34,
    left: 24,
  },
});
