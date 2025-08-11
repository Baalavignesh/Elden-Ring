import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { familyData } from "../constants/family";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const handleClose = () => {
    console.log("X button clicked - closing sidebar");
    onClose();
  };
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    console.log(`Toggling section: ${section}`);
    console.log(`Current expanded sections:`, expandedSections);
    
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      console.log(`Closing section: ${section}`);
      newExpanded.delete(section);
    } else {
      console.log(`Opening section: ${section}`);
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
    console.log(`New expanded sections:`, newExpanded);
  };

  // Get all characters from familyData
  const allCharacters = familyData.nodes.filter(node => node.name !== "unknown");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[150]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 120, duration: 1.2 }}
            className="fixed left-0 top-0 h-full w-[40%] bg-black z-[200] flex flex-col mt-8"
          >
            {/* Fixed Header with Close button */}
            <div className="flex-shrink-0 h-20 flex items-center justify-end px-12 bg-black z-[210] relative">
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white transition-colors p-3 bg-black/70 rounded-full hover:bg-black/90"
                aria-label="Close sidebar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Menu sections */}
              <div className="flex-1 overflow-y-auto">
                <div className="pt-4">
              {/* WHO Section - with all characters */}
              <div className="py-6 px-16 border-white/10 border-t border-b">    
                <button
                  onClick={() => toggleSection("who")}
                  className="flex items-center justify-center w-full text-left text-white/80 hover:text-white transition-colors group relative"
                >
                  <span className="text-xl font-light tracking-[0.3em] flex-1">WHO</span>
                  <motion.svg
                    animate={{ rotate: expandedSections.has("who") ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-white/40 group-hover:text-white/60 flex-shrink-0"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </motion.svg>
                </button>

                <AnimatePresence>
                  {expandedSections.has("who") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-6 mt-8">
                        {allCharacters.map((character) => (
                          <motion.div
                            key={character.id}
                            whileHover={{ scale: 1.05 }}
                            className="cursor-pointer group"
                          >
                            <div className="aspect-square bg-zinc-900 rounded overflow-hidden mb-2">
                              {character.image ? (
                                <img
                                  src={character.image}
                                  alt={character.name}
                                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                  <span className="text-3xl">?</span>
                                </div>
                              )}
                            </div>
                            <p className="text-base text-white/60 group-hover:text-white/80 transition-colors text-center capitalize mt-2">
                              {character.name}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Other sections */}
              {["WHERE", "TIMELINE", "LORE"].map((section) => (
                <div key={section} className="py-6 px-16 border-white/10 border-t border-b">
                  <button
                    onClick={() => toggleSection(section.toLowerCase())}
                    className="flex items-center justify-center w-full text-left text-white/80 hover:text-white transition-colors group relative"
                  >
                    <span className="text-xl font-light tracking-[0.3em] flex-1">{section}</span>
                    <motion.svg
                      animate={{ rotate: expandedSections.has(section.toLowerCase()) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-white/40 group-hover:text-white/60 flex-shrink-0"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </motion.svg>
                  </button>
                </div>
              ))}
                </div>
              </div>

              {/* Fixed Footer - pinned to bottom */}
              <div className="flex-shrink-0 px-16 py-6 border-t border-white/10 text-base text-white/40 bg-black">
                <p className="mb-1">© 2024 ELDEN RING</p>
                <p>ALL RIGHTS RESERVED</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Sidebar;