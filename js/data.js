// ==========================================
// GUIDED ARTICLES & STORIES CONTENT MANAGER
// ==========================================
// This file is your website's database! You can easily update your daily articles here 
// without ever touching the complex HTML or CSS files. The website will automatically update based on what is here.
//
// HOW TO UPDATE DAILY ARTICLES:
// 1. Copy the "TEMPLATE" below and paste it inside the "articles: [...]" list.
// 2. Change 'id' to a unique word (e.g. "focus", "day3").
// 3. Set 'isPremium: false' for free posts, or 'isPremium: true' for locked subscriber posts.
// 4. Update the 'title', 'shortPreview', and 'fullBody' text. Keep '<p>' tags around your paragraphs!
// 5. Choose one of the 6 beautiful image classes for your cover photo:
//    "bg-sage-light"  (Misty Lake)
//    "bg-clay-light"  (Abstract Silk)
//    "bg-earth-light" (Meditation Stones)
//    "bg-forest"      (Kintsugi Bowl)
//    "bg-sage-dark"   (Green Leaf on Water)
//    "bg-clay-dark"   (Journal and Tea)
//
// --- TEMPLATE ---
// {
//     id: "unique_word",
//     isPremium: false,
//     author: "Vivian Mugure",
//     date: "March 12, 2026",
//     title: "Your Title Here",
//     shortPreview: "A quick 1-sentence summary for the card.",
//     imageClass: "bg-sage-light",
//     fullBody: `
//         <p>Paragraph 1 goes here.</p>
//         <br>
//         <p>Paragraph 2 goes here.</p>
//     `
// },
// -----------------

const websiteData = {
    articles: [
        {
            id: "morning",
            isPremium: false,
            author: "Vivian Mugure",
            date: "March 12, 2026",
            title: "Morning Calm",
            shortPreview: "Start your day with gentle intention. A 5-minute practice to center your thoughts before the world wakes up.",
            imageClass: "bg-sage-light",
            fullBody: `
                <p>The first few moments of your day set the tone for everything that follows. Before reaching for your phone or diving into your to-do list, give yourself the gift of pure presence.</p>
                <br>
                <p>Begin by taking three deep, nourishing breaths. Inhale the possibilities of the new day, and exhale any lingering tension from yesterday. Notice the quiet stillness of the morning air.</p>
                <br>
                <p>By establishing this simple, grounding habit, you cultivate a reservoir of calm that will support you through whatever challenges arise today.</p>
            `
        },
        {
            id: "breathing",
            isPremium: false,
            author: "Vivian Mugure",
            date: "March 11, 2026",
            title: "Breathing Basics",
            shortPreview: "Discover the foundational techniques of mindful breathing to instantly lower your heart rate and ease anxiety.",
            imageClass: "bg-clay-light",
            fullBody: `
                <p>Your breath is an anchor—always available, always in the present moment. When anxiety naturally quickens your breathing, you can consciously slow it down to signal safety to your nervous system.</p>
                <br>
                <p>Try the simple 4-4-4-4 box breathing technique: Inhale deeply through your nose for a count of four. Hold that breath gently for four. Exhale smoothly for four. Pause and wait for four before your next breath.</p>
                <br>
                <p>Just five cycles of this pattern can dramatically shift your mental state, bringing clarity and calm to a racing mind.</p>
            `
        },
        {
            id: "bodyscan",
            isPremium: false,
            author: "Vivian Mugure",
            date: "March 10, 2026",
            title: "Body Scan Meditation",
            shortPreview: "A guided journey through your physical self to release stored tension and prepare for restorative sleep.",
            imageClass: "bg-earth-light",
            fullBody: `
                <p>We often carry the day's stress in our muscles without realizing it—hunching our shoulders, clenching our jaws, holding our breath.</p>
                <br>
                <p>Lie down in a comfortable position and bring your attention to your toes. Notice any sensation there. Consciously invite them to relax. Slowly move this gentle spotlight of attention up through your feet, your legs, your abdomen, and all the way to the crown of your head.</p>
                <br>
                <p>As you mentally scan each area, breathe into it, inviting a profound wave of relaxation to wash over you, preparing your body for deep, healing sleep.</p>
            `
        },
        {
            id: "healing",
            isPremium: true,
            author: "Vivian Mugure",
            date: "March 09, 2026",
            title: "Healing Inner Wounds",
            shortPreview: "A gentle exploration of self-compassion to help you process difficult emotions and find lasting inner peace.",
            imageClass: "bg-forest",
            fullBody: `
                <p>Emotional healing begins the moment we stop fighting our own pain and instead meet it with radical self-compassion. It involves acknowledging what hurts without judgment.</p>
                <br>
                <p>Imagine speaking to the wounded parts of yourself with the same tender, unwavering kindness you would offer a dear friend. Validate your feelings. Let yourself know that it is entirely okay to feel fragile sometimes.</p>
                <br>
                <p>This premium guided journey provides a safe, nurturing space to gently process difficult emotions, teaching you how to hold your own heart with grace and understanding.</p>
            `
        },
        {
            id: "focus",
            isPremium: true,
            author: "Vivian Mugure",
            date: "March 08, 2026",
            title: "Deep Work Focus",
            shortPreview: "Sharpen your concentration and banish distractions with this specialized meditation for peak mental performance.",
            imageClass: "bg-sage-dark",
            fullBody: `
                <p>In an age of constant notification and interruption, the ability to focus deeply is a superpower. True concentration requires more than just willpower; it requires a trained, quiet mind.</p>
                <br>
                <p>This session guides you through visualizing your thoughts as leaves floating down a stream. When a distraction arises, simply place it on a leaf and gently watch it float away, returning your gaze to the gentle flow of the water.</p>
                <br>
                <p>Practice this regularly to build your cognitive endurance, allowing you to enter states of flow effortlessly and tackle your most demanding work with clarity and ease.</p>
            `
        },
        {
            id: "gratitude",
            isPremium: true,
            author: "Vivian Mugure",
            date: "March 07, 2026",
            title: "Radical Gratitude",
            shortPreview: "Transform your daily perspective by cultivating a deep, authentic appreciation for the simple joys of life.",
            imageClass: "bg-clay-dark",
            fullBody: `
                <p>Gratitude is not just a polite 'thank you'—it is a profound lens through which we can view our entire existence. It shifts our focus from what we lack to the abundance that surrounds us.</p>
                <br>
                <p>Begin to notice the tiny miracles you usually overlook: the warmth of sunlight on your face, the intricate taste of your morning coffee, the reliable beating of your own heart.</p>
                <br>
                <p>This premium series helps you build a bulletproof gratitude habit, rewiring your brain for happiness, resilience, and a deeper connection to the present moment.</p>
            `
        }
    ]
};
