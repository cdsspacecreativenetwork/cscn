import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

// Lucide icon representation map to emojis for rich text Satori rendering
const EMOJI_MAP: Record<string, string> = {
  CheckCircle: "🥇",
  BookOpen: "💡",
  Flame: "🔥",
  Zap: "⚡",
  Award: "🎓",
  UserPlus: "👥",
  Sparkles: "✨",
  Trophy: "🏆",
  Globe: "🌐",
};

// Elegant converter to keep achieved milestones in past tense
const toPastTense = (desc: string): string => {
  if (!desc) return "";
  let d = desc;
  d = d.replace(/^Complete your/i, "Completed your");
  d = d.replace(/^Complete /i, "Completed ");
  d = d.replace(/^Maintain /i, "Maintained ");
  d = d.replace(/^Graduate /i, "Graduated ");
  d = d.replace(/^Enroll /i, "Enrolled ");
  d = d.replace(/^Reach /i, "Reached ");
  d = d.replace(/^Publish /i, "Published ");
  return d;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the UserAchievement details using the id
    const userAch = await db.userAchievement.findUnique({
      where: { id },
      include: {
        user: true,
        achievement: true,
      },
    });

    if (!userAch) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
    }

    const userName = userAch.user.name || "CSCN Learner";
    const userImage = userAch.user.image;
    const badgeName = userAch.achievement.name;
    const badgeDesc = toPastTense(userAch.achievement.description);
    const badgeEmoji = EMOJI_MAP[userAch.achievement.icon] || "🎯";

    // Set up unique card aesthetics
    let cardBg = "radial-gradient(circle at center, #0F172A 0%, #020617 100%)";
    let accentColor = "#1C4ED1";
    let titleColor = "#FFFFFF";
    let subtitleColor = "#94A3B8";
    let cardBorder = "12px solid #1C4ED1";

    if (badgeName === "First Step") {
      cardBg = "linear-gradient(135deg, #DBE5FF 0%, #F0F4FF 100%)";
      accentColor = "#1C4ED1";
      titleColor = "#040B37";
      subtitleColor = "#4B5563";
      cardBorder = "12px solid #C5D5FF";
    } else if (badgeName === "Curious Mind") {
      cardBg = "linear-gradient(135deg, #DDF5E6 0%, #F0FDF4 100%)";
      accentColor = "#10B981";
      titleColor = "#040B37";
      subtitleColor = "#4B5563";
      cardBorder = "12px solid #C4ECD2";
    } else if (badgeName === "7-Day Streak") {
      cardBg = "linear-gradient(135deg, #FFEBD3 0%, #FFFBEB 100%)";
      accentColor = "#F59E0B";
      titleColor = "#040B37";
      subtitleColor = "#4B5563";
      cardBorder = "12px solid #FCD2A9";
    } else if (badgeName === "30-Day Streak") {
      cardBg = "linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)";
      accentColor = "#A855F7";
      titleColor = "#040B37";
      subtitleColor = "#4B5563";
      cardBorder = "12px solid #E9D5FF";
    } else if (badgeName === "Course Completer") {
      cardBg = "linear-gradient(135deg, #E3F5FF 0%, #F0F9FF 100%)";
      accentColor = "#3B82F6";
      titleColor = "#040B37";
      subtitleColor = "#4B5563";
      cardBorder = "12px solid #C5EBFF";
    } else {
      cardBg = "linear-gradient(135deg, #0F172A 0%, #020617 100%)";
      accentColor = "#F59E0B";
      titleColor = "#FFFFFF";
      subtitleColor = "#94A3B8";
      cardBorder = "12px solid #334155";
    }

    // Dynamic Image Response in standard og:image dimensions (1200 x 630)
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            background: cardBg,
            fontFamily: "sans-serif",
            padding: "60px 80px",
            boxSizing: "border-box",
            position: "relative",
            border: cardBorder,
          }}
        >
          {/* Subtle glowing orbits in the background */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "rgba(28, 78, 209, 0.15)",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-150px",
              left: "-150px",
              width: "450px",
              height: "450px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.1)",
              filter: "blur(80px)",
            }}
          />

          {/* Left Panel: Branding & Credentials */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "60%",
            }}
          >
            {/* CSCN Brand - Using official CSCN Logo SVG */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "30px",
              }}
            >
              <svg width="32" height="31" viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.44693 7.55597C6.44693 7.65315 6.4862 7.74636 6.55611 7.81508C6.62602 7.8838 6.72083 7.92241 6.81969 7.92241H15.0093C15.1066 7.92238 15.2 7.95972 15.2696 8.02648C15.3393 8.09323 15.3796 8.1841 15.3821 8.27969V14.74C15.3796 14.8356 15.3393 14.9264 15.2696 14.9932C15.2 15.0599 15.1066 15.0973 15.0093 15.0973H0.372763C0.275494 15.0973 0.182066 15.0599 0.112422 14.9932C0.0427768 14.9264 0.00243173 14.8356 0 14.74V0.366453C0 0.269268 0.0392728 0.176063 0.109179 0.107342C0.179086 0.0386217 0.2739 1.52588e-05 0.372763 1.52588e-05H15C15.0988 1.52588e-05 15.1936 0.0386217 15.2636 0.107342C15.3335 0.176063 15.3727 0.269268 15.3727 0.366453V6.84141C15.3727 6.9386 15.3335 7.03181 15.2636 7.10053C15.1936 7.16925 15.0988 7.20785 15 7.20785H6.81969C6.72398 7.20773 6.63188 7.24382 6.56249 7.30862C6.49309 7.37343 6.45172 7.46199 6.44693 7.55597Z" fill={titleColor === "#FFFFFF" ? "#FFFFFF" : "#040E31"} />
                <path d="M6.44693 23.3599C6.44693 23.4571 6.4862 23.5503 6.55611 23.619C6.62602 23.6877 6.72083 23.7263 6.81969 23.7263H15.0093C15.1066 23.7263 15.2 23.7636 15.2696 23.8304C15.3393 23.8972 15.3796 23.988 15.3821 24.0836V30.5512C15.3796 30.6468 15.3393 30.7377 15.2696 30.8045C15.2 30.8712 15.1066 30.9085 15.0093 30.9085H0.372763C0.275494 30.9085 0.182066 30.8712 0.112422 30.8045C0.0427768 30.7377 0.00243173 30.6468 0 30.5512V16.1704C0.00243173 16.0748 0.0427768 15.9839 0.112422 15.9172C0.182066 15.8504 0.275494 15.8131 0.372763 15.8131H15C15.0972 15.8131 15.1907 15.8504 15.2603 15.9172C15.33 15.9839 15.3703 16.0748 15.3727 16.1704V22.6453C15.3727 22.7425 15.3335 22.8357 15.2636 22.9044C15.1936 22.9732 15.0988 23.0118 15 23.0118H6.81969C6.72398 23.0117 6.63188 23.0477 6.56249 23.1125C6.49309 23.1774 6.45172 23.2659 6.44693 23.3599Z" fill="#1C4ED1" />
                <path d="M24.7824 3.67722C24.745 3.76465 24.7435 3.86296 24.7782 3.95146C24.813 4.03996 24.8813 4.11177 24.9688 4.15176L31.6786 7.14922C31.7414 7.17865 31.7946 7.2248 31.8322 7.28244C31.8698 7.34008 31.8901 7.40691 31.891 7.47535V14.74C31.8911 14.8356 31.8531 14.9275 31.7852 14.9959C31.7173 15.0644 31.6248 15.104 31.5276 15.1064H16.8855C16.7882 15.104 16.6958 15.0644 16.6279 14.9959C16.56 14.9275 16.522 14.8356 16.522 14.74V12.7924C16.523 12.7199 16.5459 12.6494 16.5877 12.5897C16.6295 12.53 16.6884 12.4839 16.7569 12.4571L22.9279 10.187C23.0174 10.1521 23.0896 10.0846 23.1296 9.99852C23.1695 9.91247 23.1741 9.81456 23.1423 9.72528C23.1064 9.6377 23.0376 9.56708 22.9501 9.52817C22.8626 9.48926 22.7632 9.48505 22.6726 9.51641L17.0122 11.5996C16.9562 11.6195 16.8962 11.6259 16.8372 11.6184C16.7781 11.6108 16.7218 11.5894 16.7299 11.5561C16.624 11.5227 16.5839 11.4783 16.5561 11.4266C16.5282 11.3749 16.5133 11.3173 16.5127 11.2588V0.366453C16.5127 0.270835 16.5507 0.17899 16.6186 0.110527C16.6865 0.0420634 16.7789 0.00240573 16.8761 1.52588e-05H31.5052C31.6025 0.00240573 31.6949 0.0420634 31.7628 0.110527C31.8307 0.17899 31.8687 0.270835 31.8687 0.366453V5.9015C31.8666 5.96058 31.85 6.01829 31.8203 6.06969C31.7906 6.1211 31.7487 6.16468 31.6982 6.19672C31.6476 6.22876 31.5899 6.24831 31.5301 6.25369C31.4702 6.25907 31.4099 6.25013 31.3542 6.22763L25.2726 3.4995C25.1835 3.46005 25.0822 3.45657 24.9906 3.48981C24.8989 3.52305 24.8241 3.59035 24.7824 3.67722Z" fill="#16186E" />
                <path d="M31.8761 16.1704V30.5512C31.8737 30.6468 31.8333 30.7377 31.7637 30.8045C31.6941 30.8712 31.6006 30.9085 31.5034 30.9085H22.3278V25.1957C22.3278 25.148 22.3181 25.1008 22.2993 25.0569C22.2804 25.0129 22.2528 24.9731 22.2181 24.9398C22.1833 24.9065 22.1422 24.8804 22.097 24.863C22.0518 24.8456 22.0035 24.8372 21.955 24.8385C21.8594 24.8408 21.7683 24.8792 21.7007 24.9457C21.633 25.0122 21.594 25.1017 21.5916 25.1957V30.9085H16.8855C16.7882 30.9085 16.6948 30.8712 16.6251 30.8045C16.5555 30.7377 16.5151 30.6468 16.5127 30.5512V16.1704C16.5151 16.0764 16.5541 15.9868 16.6218 15.9203C16.6894 15.8538 16.7805 15.8154 16.8761 15.8131H24.2718C24.3412 15.8138 24.409 15.8336 24.4676 15.8701C24.5263 15.9067 24.5733 15.9587 24.6035 16.0201L27.6527 22.616C27.7035 22.6834 27.7763 22.7316 27.8589 22.7525C27.9415 22.7735 28.0289 22.766 28.1065 22.7313C28.1842 22.6965 28.2473 22.6367 28.2855 22.5617C28.3237 22.4867 28.3345 22.4011 28.3162 22.3192L25.541 16.3261C25.5181 16.2714 25.509 16.2122 25.5145 16.1533C25.52 16.0944 25.5399 16.0377 25.5725 15.988C25.605 15.9384 25.6494 15.8972 25.7017 15.868C25.754 15.8388 25.8127 15.8225 25.8728 15.8204H31.5034C31.5994 15.8203 31.6917 15.8567 31.7612 15.9219C31.8306 15.9871 31.8718 16.0761 31.8761 16.1704Z" fill="#219DFF"/>
              </svg>
              <span
                style={{
                  color: titleColor,
                  fontSize: "24px",
                  fontWeight: 900,
                  marginLeft: "10px",
                  letterSpacing: "0.5px",
                }}
              >
                CSCN
              </span>
            </div>

            <span
              style={{
                color: accentColor,
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Verified Ecosystem Achievement
            </span>

            <h1
              style={{
                color: titleColor,
                fontSize: "46px",
                fontWeight: 900,
                margin: "0 0 10px 0",
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              {userName}
            </h1>

            {/* Flat single string prevents nested Satori line-wrapping distortion */}
            <p
              style={{
                color: subtitleColor,
                fontSize: "18px",
                fontWeight: 600,
                lineHeight: 1.5,
                margin: "0 0 45px 0",
              }}
            >
              {`Successfully completed all milestone criteria and unlocked the prestigious ${badgeName} badge on our global learning network.`}
            </p>

            {/* User credentials footer */}
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    border: `3px solid ${accentColor}`,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: titleColor === "#FFFFFF" ? "#1E293B" : "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `3px solid ${accentColor}`,
                  }}
                >
                  <span style={{ color: accentColor, fontSize: "20px", fontWeight: "bold" }}>
                    {userName.charAt(0)}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: titleColor, fontSize: "16px", fontWeight: 800 }}>
                  Verified Recipient
                </span>
                <span style={{ color: subtitleColor, fontSize: "13px", fontWeight: 600 }}>
                  CSCN Ecosystem Certification
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Large floating badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "35%",
              position: "relative",
            }}
          >
            {/* Glowing border rings */}
            <div
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                border: `2px dashed ${accentColor}88`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "50%",
                  backgroundColor: titleColor === "#FFFFFF" ? "rgba(30, 41, 59, 0.6)" : "rgba(255, 255, 255, 0.8)",
                  border: `3px solid ${accentColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 30px ${accentColor}44`,
                }}
              >
                <span style={{ fontSize: "96px" }}>{badgeEmoji}</span>
              </div>
            </div>

            <span
              style={{
                marginTop: "25px",
                color: accentColor,
                fontSize: "20px",
                fontWeight: 900,
                letterSpacing: "4px",
                textTransform: "uppercase",
              }}
            >
              {badgeName}
            </span>
            <span
              style={{
                marginTop: "4px",
                color: subtitleColor,
                fontSize: "13px",
                fontWeight: 700,
                textAlign: "center",
                maxWidth: "220px",
              }}
            >
              {badgeDesc}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OpenGraph social card:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
