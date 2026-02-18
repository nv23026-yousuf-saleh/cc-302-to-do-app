# CC302 ToDo App Assignment Submission

**Student Name:** Yousuf Alaali  
**Student ID:** NV23026  
**Course:** CC302 - Cloud Computing

---

## 1. Git Branches

All required branches have been created with the following structure:

```
* dev
  feature/calendar-deadlines
  feature/dark-mode
  feature/pomodoro-timer
  feature/search-tasks
  main
```

**Branch Strategy:**
- `main` - Stable production branch
- `dev` - Integration branch for features
- `feature/dark-mode` - Dark mode toggle feature
- `feature/calendar-deadlines` - Calendar view with deadlines
- `feature/pomodoro-timer` - Pomodoro focus timer
- `feature/search-tasks` - Task search with priority filters

---

## 2. Pull Requests (Feature Branches → Dev)

### PR #1: Search Tasks Feature
- **Branch:** feature/search-tasks → dev
- **Link:** https://github.com/nv23026-yousuf-saleh/cc-302-to-do-app/pull/1
- **Description:** Implemented search functionality with text highlighting and priority filters

### PR #2: Dark Mode Feature
- **Branch:** feature/dark-mode → dev
- **Link:** https://github.com/nv23026-yousuf-saleh/cc-302-to-do-app/pull/2
- **Description:** Added dark mode toggle with theme persistence using localStorage

### PR #3: Calendar & Deadlines Feature
- **Branch:** feature/calendar-deadlines → dev
- **Link:** https://github.com/nv23026-yousuf-saleh/cc-302-to-do-app/pull/3
- **Description:** Implemented calendar view with deadline tracking and visual indicators

---

## 3. Pull Request (Dev → Main)

### PR #4: Release Merge
- **Branch:** dev → main
- **Link:** https://github.com/nv23026-yousuf-saleh/cc-302-to-do-app/pull/4
- **Description:** Merged all feature branches from dev to main for production release

---

## 4. Docker Container & Versioning

**Repository:** yousufalaali/todo-cc302  
**DockerHub URL:** https://hub.docker.com/r/yousufalaali/todo-cc302

**Tags Published:**
- `1.2.1` - Current version (SemVer)
- `latest` - Points to v1.2.1

**Dockerfile:** Properly configured with Python 3.11-slim base image, requirements installation, and Flask app execution.

---

## 5. GitHub Release

**Release Tag:** v1.2.1 - Feature Release  
**GitHub Release Link:** https://github.com/nv23026-yousuf-saleh/cc-302-to-do-app/releases/tag/v1.2.1

**Release Notes - v1.2.1 Features:**
- ✅ Dark mode toggle with theme persistence
- ✅ Calendar view with deadline tracking
- ✅ Pomodoro focus timer with XP rewards
- ✅ Task search with priority filters and text highlighting

---

## 6. Features Implemented

### Feature 1: Dark Mode Toggle
- Implemented theme switcher with light/dark modes
- Theme preference saved in localStorage
- Full CSS variable system for seamless theme switching
- Professional UI transitions between themes

### Feature 2: Calendar View with Deadlines
- Interactive calendar with month navigation
- Visual indicators for tasks with deadlines
- Click-to-view tasks for specific dates
- Color-coded priority dots on calendar days

### Feature 3: Pomodoro Focus Timer
- 25-minute work sessions with break intervals
- Visual timer ring with progress indicator
- Task selection for focused work
- XP rewards system for completed sessions
- Configurable work and break durations

### Feature 4: Task Search
- Real-time search with text highlighting
- Priority filter buttons (All/High/Medium/Low)
- Clear search button for quick reset
- Results counter showing number of matches

---

## 7. Learning Reflection: Branching and Merging

In this assignment, I learned how to use Git branches to organize my work effectively. Creating a `dev` branch for testing new features and separate feature branches for each task helped me keep the `main` branch clean and stable. 

I discovered that working with branches allows developers to isolate different features, making it easier to test and review code changes before integrating them into the main codebase. Using pull requests proved invaluable - they provide a mechanism to review changes, discuss improvements, and catch issues before merging. I also experienced real merge conflicts and learned how to resolve them properly.

The semantic versioning system (1.2.1) taught me the importance of tracking versions systematically. Each release represents a milestone in the application's development. Understanding major.minor.patch versioning helps users and developers understand what kind of changes were made in each release.

The most important lesson was realizing that branching and merging are essential skills for collaborative development. In a team environment, everyone can work on different features simultaneously without stepping on each other's toes. Git enables this parallel development workflow beautifully.

---

## 8. Technical Summary

**Git Workflow Implemented:**
- ✅ Main → Dev → Feature branch structure
- ✅ Created 4 feature branches from dev
- ✅ Merged features back to dev via pull requests
- ✅ Final merge from dev to main for production release

**Code Quality:**
- Clean, modular JavaScript with proper function separation
- Responsive CSS using CSS variables for theme support
- LocalStorage for persistent data across browser sessions
- Professional UI with smooth animations and transitions

**Container & Versioning:**
- Docker image built with semantic versioning (1.2.1)
- Pushed to DockerHub with version tag and latest tag
- GitHub release created with detailed release notes

---

**Submission Date:** February 18, 2026
