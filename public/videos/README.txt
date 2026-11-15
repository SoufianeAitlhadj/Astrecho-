Mission films used by the story pages.

  Video2.mp4  = Opportunity_vox.mp4      -> Mars story (Opportunity)
  Video3.mp4  = pioneer10_vox.mp4        -> Deep Space story (Pioneer 10)
  Video1.mp4  = (none yet)               -> Moon story; VIDEOS.moon is null in
                                            src/data/missionData.js, so the
                                            video panel hides itself there.

To add a Moon film: drop Video1.mp4 in this folder and set VIDEOS.moon in
src/data/missionData.js to { title, src: "videos/Video1.mp4", summary, ... }.
Keep `summary` truthful: Ask C.U.R.I.O. quotes it as a source.
