import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFacebookF, faTwitter, faLinkedinIn, faInstagram, faYoutube 
} from "@fortawesome/free-brands-svg-icons";
import { 
  faEnvelope, faPhone, faLocationDot, faChartLine, faUpload, 
  faUsers, faFolderOpen, faGraduationCap, faBullhorn, faCheckCircle,
  faTachometerAlt, faFileAlt, faUserCheck, faGlobe, faChartBar,
  faRocket, faShieldAlt, faBookOpen, faArrowRight
} from "@fortawesome/free-solid-svg-icons";

export default function HomePage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState({});
  
  // Scroll animation observer
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => ({ ...prev, [entry.target.id]: true }));
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('section').forEach(section => {
      observer.observe(section);
    });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Why CSBM Needs Analytics - Value Cards
  const valueCards = [
    {
      icon: faGraduationCap,
      title: "Student Performance Tracking",
      description: "Monitor individual student progress, identify at-risk students, and intervene early with data-driven insights.",
      color: "#667eea",
      stats: "89% Improvement"
    },
    {
      icon: faChartBar,
      title: "Program Effectiveness",
      description: "Analyze which programs deliver the best outcomes. Optimize curriculum based on real completion rates.",
      color: "#f59e0b",
      stats: "24 Programs Analyzed"
    },
    {
      icon: faUserCheck,
      title: "Admission Intelligence",
      description: "Predict enrollment trends, optimize intake numbers, and improve student retention with predictive analytics.",
      color: "#10b981",
      stats: "40% Better Retention"
    },
    {
      icon: faBullhorn,
      title: "Marketing ROI",
      description: "Track which marketing channels bring quality students. Optimize your digital marketing spend effectively.",
      color: "#ef4444",
      stats: "35% Cost Reduction"
    },
    {
      icon: faGlobe,
      title: "Location Intelligence",
      description: "Understand where your students come from. Optimize outreach and campus expansion decisions.",
      color: "#8b5cf6",
      stats: "15+ Regions Tracked"
    },
    {
      icon: faRocket,
      title: "Career Outcomes",
      description: "Track graduate employment rates, salary trends, and industry demand for your programs.",
      color: "#06b6d4",
      stats: "92% Placement Rate"
    }
  ];

  // Platform Features - What Users Can Do
  const platformFeatures = [
    {
      icon: faUpload,
      title: "Upload & Preview",
      description: "Upload student documents, preview extracted data, and validate before processing.",
      path: "/upload",
      role: "Admin & Users",
      color: "#667eea"
    },
    {
      icon: faChartLine,
      title: "Batch Analytics",
      description: "Compare batch performance, track completion rates, and identify trends across cohorts.",
      path: "/analytics/batches",
      role: "Admin Only",
      color: "#f59e0b"
    },
    {
      icon: faUsers,
      title: "User Management",
      description: "Approve new users, assign roles, manage permissions, and monitor activity.",
      path: "/admin/users",
      role: "Admin Only",
      color: "#10b981"
    },
    {
      icon: faFolderOpen,
      title: "Direction Management",
      description: "Organize programs by direction, track progress, and manage academic pathways.",
      path: "/directions",
      role: "Admin & Users",
      color: "#ef4444"
    },
    {
      icon: faFileAlt,
      title: "Report Generation",
      description: "Export comprehensive reports for stakeholders, accreditation, and planning.",
      path: "/reports",
      role: "Admin Only",
      color: "#8b5cf6"
    },
    {
      icon: faShieldAlt,
      title: "Approval Workflow",
      description: "Streamlined user approval process with role-based access control.",
      path: "/admin/approvals",
      role: "Admin Only",
      color: "#06b6d4"
    }
  ];

  // Help & Resources for Different Departments
  const helpCards = [
    {
      title: "📢 For Marketing Team",
      tips: [
        "Track campaign performance by source",
        "Measure cost per enrolled student",
        "Identify highest-converting channels"
      ],
      action: "View Marketing Dashboard",
      path: "/analytics/marketing",
      color: "#ef4444"
    },
    {
      title: "🎓 For Admissions",
      tips: [
        "Predict enrollment numbers",
        "Optimize intake deadlines",
        "Track application funnel"
      ],
      action: "Admissions Analytics",
      path: "/analytics/admissions",
      color: "#10b981"
    },
    {
      title: "👨‍🏫 For Academic Office",
      tips: [
        "Monitor program completion rates",
        "Identify struggling students early",
        "Track faculty performance metrics"
      ],
      action: "Academic Dashboard",
      path: "/analytics/academic",
      color: "#667eea"
    },
    {
      title: "💰 For Finance",
      tips: [
        "Track program profitability",
        "Optimize resource allocation",
        "Forecast revenue by cohort"
      ],
      action: "Financial Analytics",
      path: "/analytics/finance",
      color: "#f59e0b"
    }
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={{ ...styles.header, ...(scrolled && styles.headerScrolled) }}>
        <div style={styles.brandWrap} onClick={() => navigate("/")}>
          <div style={styles.brandLogo}>
            <img src="/images/csbm-logo.png" alt="CSBM Logo" style={styles.logoImage} 
              onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/48x48?text=CSBM"; }} />
          </div>
          <div>
            <div style={styles.brandTitle}>CSBM Smart Analytics Engine</div>
            <div style={styles.brandSub}>Premium academic intelligence platform</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {["Home", "Why Analytics", "Features", "Resources", "Contact"].map((item) => (
            <button key={item} style={styles.navLink}
              onClick={() => scrollToId(item.toLowerCase().replace(" ", "-"))}
              onMouseEnter={(e) => e.target.style.color = "#667eea"}
              onMouseLeave={(e) => e.target.style.color = "#1a1a2e"}>
              {item}
            </button>
          ))}
        </nav>

        <div style={styles.headerActions}>
          <button style={styles.ghostBtn} onClick={() => navigate("/login")}>Sign In</button>
          <button style={styles.primaryBtn} onClick={() => navigate("/register")}>Get Started</button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" style={styles.heroSection}>
        <video autoPlay muted loop playsInline style={styles.heroVideo}>
          <source src="/videos/video.mp4" type="video/mp4" />
        </video>
        <div style={styles.heroOverlay} />
        
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <span style={styles.pulse}></span>
            Live Academic Analytics Platform
          </div>
          <h1 style={styles.heroTitle}>
            Transform CSBM's Academic Data
            <span style={styles.gradientText}> into Actionable Intelligence</span>
          </h1>
          <p style={styles.heroText}>
            Upload, analyze, and visualize student data with our premium analytics engine. 
            Make data-driven decisions that improve student outcomes and operational efficiency.
          </p>
          <div style={styles.heroActions}>
            <button style={styles.heroPrimaryBtn} onClick={() => navigate("/login")}>
              Launch Dashboard →
            </button>
            <button style={styles.heroSecondaryBtn} onClick={() => scrollToId("why-analytics")}>
              Why Analytics?
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div style={styles.trustBadges}>
            <span>✓ Used by CSBM Malabe</span>
            <span>✓ 200+ Active Students</span>
            <span>✓ 10+ Programs</span>
          </div>
        </div>
      </section>

      {/* Why Analytics Section - Value Cards */}
      <section id="why-analytics" style={styles.valueSection}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>Why CSBM Needs Data Analytics</span>
            <h2 style={styles.sectionTitle}>Transform Challenges into Opportunities</h2>
            <p style={styles.sectionSubtitle}>Data-driven insights that help CSBM grow and succeed</p>
          </div>
          
          <div style={styles.valueGrid}>
            {valueCards.map((card, index) => (
              <div key={index} style={{ ...styles.valueCard, borderBottomColor: card.color }}
                className={`fade-in ${visibleSections['why-analytics'] ? 'visible' : ''}`}
                style={{ ...styles.valueCard, borderBottomColor: card.color, animationDelay: `${index * 0.1}s` }}>
                <div style={{ ...styles.valueIcon, background: `${card.color}15`, color: card.color }}>
                  <FontAwesomeIcon icon={card.icon} />
                </div>
                <h3 style={styles.valueTitle}>{card.title}</h3>
                <p style={styles.valueDescription}>{card.description}</p>
                <div style={{ ...styles.valueStat, color: card.color }}>{card.stats}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section - What Users Can Do */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>Platform Capabilities</span>
            <h2 style={styles.sectionTitle}>What You Can Do With CSBM Analytics</h2>
            <p style={styles.sectionSubtitle}>Powerful tools for administrators, faculty, and staff</p>
          </div>
          
          <div style={styles.featuresGrid}>
            {platformFeatures.map((feature, index) => (
              <div key={index} style={styles.featureCard} className="feature-card"
                onClick={() => navigate(feature.path)}>
                <div style={{ ...styles.featureIcon, background: `${feature.color}15`, color: feature.color }}>
                  <FontAwesomeIcon icon={feature.icon} />
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.description}</p>
                <div style={styles.featureMeta}>
                  <span style={{ ...styles.featureRole, background: `${feature.color}15`, color: feature.color }}>
                    {feature.role}
                  </span>
                  <FontAwesomeIcon icon={faArrowRight} style={{ color: feature.color, fontSize: "14px" }} />
                </div>
              </div>
            ))}
          </div>
          
          <div style={styles.viewAllBtn}>
           
          </div>
        </div>
      </section>

      {/* Help & Resources Section - Department Specific */}
      <section id="resources" style={styles.helpSection}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>Department Resources</span>
            <h2 style={styles.sectionTitle}>Help for Every Team</h2>
            <p style={styles.sectionSubtitle}>Tailored analytics insights for different departments</p>
          </div>
          
          <div style={styles.helpGrid}>
            {helpCards.map((card, index) => (
              <div key={index} style={{ ...styles.helpCard, borderTopColor: card.color }}
                onClick={() => navigate(card.path)}>
                <div style={styles.helpTitle}>{card.title}</div>
                <ul style={styles.helpList}>
                  {card.tips.map((tip, i) => (
                    <li key={i}><FontAwesomeIcon icon={faCheckCircle} style={{ color: card.color, fontSize: "12px" }} /> {tip}</li>
                  ))}
                </ul>
                <button style={{ ...styles.helpBtn, color: card.color, borderColor: card.color }}>
                  {card.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Preview Dashboard */}
      <section style={styles.previewSection}>
        <div style={styles.container}>
          <div style={styles.previewGrid}>
            <div style={styles.previewContent}>
              <span style={styles.sectionTagLight}>Live Demo</span>
              <h2 style={styles.previewTitle}>See Analytics in Action</h2>
              <p style={styles.previewText}>
                Watch how CSBM Analytics transforms raw student data into beautiful, 
                actionable insights. Track batches, monitor user activity, and generate 
                reports in real-time.
              </p>
              <div style={styles.previewStats}>
                <div><strong>200+</strong> Students Tracked</div>
                <div><strong>10+</strong> Active Programs</div>
                <div><strong>10+</strong> Documents Processed</div>
              </div>
              <button style={styles.previewBtn} onClick={() => navigate("/login")}>
                Explore Live Dashboard →
              </button>
            </div>
            <div style={styles.previewImage}>
              <div style={styles.dashboardMock}>
                <div style={styles.mockHeader}>
                  <div style={styles.mockDot}></div><div style={styles.mockDot}></div><div style={styles.mockDot}></div>
                </div>
                <div style={styles.mockChart}>
                  <div style={styles.mockBar1}></div><div style={styles.mockBar2}></div>
                  <div style={styles.mockBar3}></div><div style={styles.mockBar4}></div>
                </div>
                <div style={styles.mockStats}>
                  <div>📊 Batch Performance</div>
                  <div>📈 89% Growth</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section with Real CSBM Info */}
      <section id="contact" style={styles.contactSection}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>Get In Touch</span>
            <h2 style={styles.sectionTitle}>Contact CSBM Campus</h2>
            <p style={styles.sectionSubtitle}>Reach out to our administrative team for support</p>
          </div>
          
          <div style={styles.contactGrid}>
            <div style={styles.contactInfo}>
              <div style={styles.contactCard}>
                <div style={styles.contactIcon}><FontAwesomeIcon icon={faEnvelope} /></div>
                <h4>Email Us</h4>
                <p>info@csbm.edu.lk</p>
                <p>support@csbm.edu.lk</p>
                <small>Admissions: diviya.l@csbm.edu.lk</small>
              </div>
              <div style={styles.contactCard}>
                <div style={styles.contactIcon}><FontAwesomeIcon icon={faPhone} /></div>
                <h4>Call Us</h4>
                <p>071 066 7667 (Main Hotline)</p>
                <p>070 583 4979 (Admissions)</p>
                <p>070 366 7690 (Academic)</p>
              </div>
              <div style={styles.contactCard}>
                <div style={styles.contactIcon}><FontAwesomeIcon icon={faLocationDot} /></div>
                <h4>Visit Us</h4>
                <p>No. 388/1B, Kaduwela Road</p>
                <p>Malabe, Sri Lanka</p>
                <small>Near CINEC IT Park</small>
              </div>
            </div>
            
            <div style={styles.contactForm}>
              <h3 style={styles.formTitle}>Send us a message</h3>
              <input type="text" placeholder="Your Name" style={styles.formInput} />
              <input type="email" placeholder="Your Email" style={styles.formInput} />
              <select style={styles.formSelect}>
                <option>General Inquiry</option>
                <option>Admissions</option>
                <option>Academic Support</option>
                <option>Technical Support</option>
              </select>
              <textarea placeholder="Your Message" rows="4" style={styles.formTextarea}></textarea>
              <button style={styles.submitBtn}>Send Message →</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerGrid}>
            <div>
              <div style={styles.footerLogo}>
                <span>CSBM Analytics</span>
              </div>
              <p style={styles.footerText}>Smart Analytics Engine for Academic Excellence</p>
              <div style={styles.socialIcons}>
                <a href="https://facebook.com/csbm" target="_blank" style={styles.socialIconLink}><FontAwesomeIcon icon={faFacebookF} /></a>
                <a href="https://twitter.com/csbm" target="_blank" style={styles.socialIconLink}><FontAwesomeIcon icon={faTwitter} /></a>
                <a href="https://linkedin.com/school/csbm" target="_blank" style={styles.socialIconLink}><FontAwesomeIcon icon={faLinkedinIn} /></a>
                <a href="https://instagram.com/csbm" target="_blank" style={styles.socialIconLink}><FontAwesomeIcon icon={faInstagram} /></a>
                <a href="https://youtube.com/csbm" target="_blank" style={styles.socialIconLink}><FontAwesomeIcon icon={faYoutube} /></a>
              </div>
            </div>
            <div>
              <h4 style={styles.footerHeading}>Platform</h4>
              <ul style={styles.footerLinks}>
                <li><button onClick={() => navigate("/login")}>Analytics Dashboard</button></li>
                <li><button onClick={() => navigate("/upload")}>Upload Center</button></li>
                <li><button onClick={() => navigate("/register")}>Register Account</button></li>
                <li><button onClick={() => navigate("/admin/users")}>User Management</button></li>
              </ul>
            </div>
            <div>
              <h4 style={styles.footerHeading}>Resources</h4>
              <ul style={styles.footerLinks}>
                <li><a href="https://csbm.edu.lk" target="_blank">CSBM Website</a></li>
                <li><a href="https://student.csbm.edu.lk" target="_blank">Student Portal</a></li>
                <li><button onClick={() => scrollToId("resources")}>Department Guides</button></li>
                <li><button onClick={() => navigate("/support")}>Support Center</button></li>
              </ul>
            </div>
            <div>
              <h4 style={styles.footerHeading}>Legal</h4>
              <ul style={styles.footerLinks}>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/security">Security</a></li>
              </ul>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <p>© 2026 CSBM Analytics Platform. All rights reserved.</p>
            <p>Colombo School of Business & Management - Malabe, Sri Lanka</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .feature-card, .value-card, .help-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          cursor: pointer;
        }
        .value-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
        }
        .help-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
          cursor: pointer;
        }
        .fade-in {
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
        }
        .fade-in.visible {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflowX: "hidden",
  },
  
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 5%",
    transition: "all 0.3s ease",
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
  },
  headerScrolled: {
    padding: "12px 5%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },
  brandLogo: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#f0f0f0",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  brandTitle: {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#1a1a2e",
  },
  brandSub: {
    fontSize: "0.75rem",
    color: "#666",
  },
  nav: {
    display: "flex",
    gap: "32px",
    alignItems: "center",
  },
  navLink: {
    background: "none",
    border: "none",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#1a1a2e",
    cursor: "pointer",
    transition: "color 0.3s ease",
    padding: "8px 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  ghostBtn: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "1.5px solid #e0e0e0",
    background: "transparent",
    color: "#1a1a2e",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  primaryBtn: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.3s ease",
  },

  heroSection: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },
  heroVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "120px 5%",
    color: "#fff",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "50px",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    fontSize: "0.85rem",
    fontWeight: 500,
    marginBottom: "24px",
  },
  pulse: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10b981",
    animation: "pulse 2s infinite",
  },
  heroTitle: {
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: "24px",
  },
  gradientText: {
    background: "linear-gradient(135deg, #667eea 0%, #f093fb 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroText: {
    fontSize: "clamp(1rem, 2vw, 1.2rem)",
    maxWidth: "600px",
    marginBottom: "32px",
    opacity: 0.9,
    lineHeight: 1.6,
  },
  heroActions: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "32px",
  },
  heroPrimaryBtn: {
    padding: "14px 32px",
    borderRadius: "8px",
    border: "none",
    background: "#fff",
    color: "#667eea",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "transform 0.3s ease",
  },
  heroSecondaryBtn: {
    padding: "14px 32px",
    borderRadius: "8px",
    border: "1.5px solid #fff",
    background: "transparent",
    color: "#fff",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  trustBadges: {
    display: "flex",
    gap: "24px",
    fontSize: "0.85rem",
    opacity: 0.8,
    flexWrap: "wrap",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 5%",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "48px",
  },
  sectionTag: {
    display: "inline-block",
    padding: "4px 16px",
    borderRadius: "50px",
    background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
    color: "#667eea",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "16px",
  },
  sectionTagLight: {
    display: "inline-block",
    padding: "4px 16px",
    borderRadius: "50px",
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: "16px",
  },
  sectionSubtitle: {
    fontSize: "1rem",
    color: "#666",
    maxWidth: "600px",
    margin: "0 auto",
  },

  // Value Section (Why Analytics)
  valueSection: {
    padding: "80px 0",
    background: "#f8f9fa",
  },
  valueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "32px",
  },
  valueCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "32px",
    borderBottom: "3px solid",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
  },
  valueIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    marginBottom: "20px",
  },
  valueTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: "12px",
  },
  valueDescription: {
    fontSize: "0.9rem",
    color: "#666",
    lineHeight: 1.6,
    marginBottom: "16px",
  },
  valueStat: {
    fontSize: "0.85rem",
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: "20px",
    background: "#f5f5f5",
    display: "inline-block",
  },

  // Features Section
  featuresSection: {
    padding: "80px 0",
    background: "#fff",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "32px",
  },
  featureCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "28px",
    border: "1px solid #eee",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
  },
  featureIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.3rem",
    marginBottom: "20px",
  },
  featureTitle: {
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: "10px",
  },
  featureDesc: {
    fontSize: "0.85rem",
    color: "#666",
    lineHeight: 1.5,
    marginBottom: "16px",
  },
  featureMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featureRole: {
    fontSize: "0.7rem",
    padding: "4px 8px",
    borderRadius: "4px",
    fontWeight: 600,
  },
  viewAllBtn: {
    textAlign: "center",
    marginTop: "48px",
  },

  // Help Section
  helpSection: {
    padding: "80px 0",
    background: "#f8f9fa",
  },
  helpGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  helpCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    borderTop: "3px solid",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
  },
  helpTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: "16px",
  },
  helpList: {
    listStyle: "none",
    padding: 0,
    marginBottom: "20px",
  },
  helpBtn: {
    background: "none",
    border: "1px solid",
    padding: "8px 16px",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  // Preview Section
  previewSection: {
    padding: "80px 0",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "48px",
    alignItems: "center",
  },
  previewContent: {
    paddingRight: "32px",
  },
  previewTitle: {
    fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
    fontWeight: 700,
    marginBottom: "20px",
  },
  previewText: {
    fontSize: "1rem",
    lineHeight: 1.6,
    marginBottom: "24px",
    opacity: 0.9,
  },
  previewStats: {
    display: "flex",
    gap: "24px",
    marginBottom: "32px",
    flexWrap: "wrap",
  },
  previewBtn: {
    padding: "12px 28px",
    borderRadius: "8px",
    border: "none",
    background: "#fff",
    color: "#667eea",
    fontWeight: 700,
    cursor: "pointer",
  },
  previewImage: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "24px",
    backdropFilter: "blur(10px)",
  },
  dashboardMock: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    color: "#1a1a2e",
  },
  mockHeader: {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
  },
  mockDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#ddd",
  },
  mockChart: {
    display: "flex",
    alignItems: "flex-end",
    gap: "16px",
    height: "100px",
    marginBottom: "20px",
  },
  mockBar1: { flex: 1, height: "60%", background: "#667eea", borderRadius: "4px" },
  mockBar2: { flex: 1, height: "80%", background: "#764ba2", borderRadius: "4px" },
  mockBar3: { flex: 1, height: "45%", background: "#f093fb", borderRadius: "4px" },
  mockBar4: { flex: 1, height: "70%", background: "#4facfe", borderRadius: "4px" },
  mockStats: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "12px",
    borderTop: "1px solid #eee",
    fontSize: "12px",
  },

  // Contact Section
  contactSection: {
    padding: "80px 0",
    background: "#fff",
  },
  contactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "48px",
  },
  contactInfo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
  },
  contactCard: {
    textAlign: "center",
    padding: "24px",
    borderRadius: "16px",
    background: "#f8f9fa",
  },
  contactIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    color: "#667eea",
    fontSize: "1.2rem",
  },
  contactForm: {
    padding: "32px",
    borderRadius: "16px",
    background: "#f8f9fa",
  },
  formTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "20px",
    color: "#1a1a2e",
  },
  formInput: {
    width: "100%",
    padding: "12px",
    marginBottom: "16px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "0.9rem",
  },
  formSelect: {
    width: "100%",
    padding: "12px",
    marginBottom: "16px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    background: "#fff",
  },
  formTextarea: {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    resize: "vertical",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  // Footer
  footer: {
    background: "#0f0f1a",
    color: "#fff",
    padding: "48px 0 24px",
  },
  footerContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 5%",
  },
  footerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "40px",
    marginBottom: "48px",
  },
  footerLogo: {
    fontSize: "1.3rem",
    fontWeight: 700,
    marginBottom: "16px",
  },
  footerText: {
    fontSize: "0.85rem",
    opacity: 0.7,
    marginBottom: "20px",
  },
  socialIcons: {
    display: "flex",
    gap: "12px",
  },
  socialIconLink: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    transition: "all 0.3s ease",
    textDecoration: "none",
  },
  footerHeading: {
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: "20px",
  },
  footerLinks: {
    listStyle: "none",
    padding: 0,
  },
  footerBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    paddingTop: "24px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    fontSize: "0.75rem",
    opacity: 0.7,
  },
};