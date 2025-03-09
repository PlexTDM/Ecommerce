export const calculateAverageRating = ratings => {
    if (!ratings || ratings.length === 0) {
        return 0
    }

    const ratingObj = ratings[0]

    let totalStars = 0;
    let totalVotes = 0;

    for (let i = 1; i <= 5; i++) {
        const starCount = ratingObj[i];
        totalStars += i * starCount;
        totalVotes += starCount;
    }

    if (totalVotes === 0) {
        return 5;
    }

    return totalStars / totalVotes;
}

export const totalVotes = ratings => {
    let total = 0
    for (let i = 0; i < 5; i++) {
        total += parseInt(ratings[0][Object.keys(ratings[0])[i]])
    }
    if (total === 0) {
        // random number between 20 (16 + 5) 16 is not included so 15 + 5
        return Math.floor(Math.random() * 16) + 5;
    }
    return total
}

export const parseUrlParts = (url, size) => {
    if (size) {
        return url.replace(/\/ex\/\d+\.\d+\//, `/ex/${size}/`)
    }
    return url.replace(/\/ex\/\d+\.\d+\//, `/ex/256.256/`)
}

export const getFullImage = (url, size) => {
    return url.replace(/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\//, "/").replace(/\/ex\/\d+\.\d+\//, `/ex/${size}/`)
}