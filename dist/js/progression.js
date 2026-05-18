function saveProgress(lessonId, score) {
    const progress = JSON.parse(
        localStorage.getItem('sigma_progress') || '[]'
    );

    progress.push({
        lessonId,
        score,
        completed: true,
        date: new Date().toISOString()
    });

    localStorage.setItem(
        'sigma_progress',
        JSON.stringify(progress)
    );
}
