// Which venues read as teaching. Lives in its own module with no path aliases so the search
// layer and the node publish scripts share one definition; importing it from lib/search.ts
// would drag the "@/" alias into a runtime that cannot resolve it.
export const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;
