import path from 'path'
import fs from 'fs'
import puppeteer from 'puppeteer';

const __dirname = path.resolve()

export const scrapeData = async () => {
    const url = 'https://otakumode.com/shop';
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector(".p-product-slider__list");

    // Click through all the sliders
    await page.evaluate(async () => {
        const sliders = document.querySelectorAll('.p-product-slider__list');
        const maxClicks = 5;

        for (const slider of sliders) {
            const btn = slider.querySelector('.slick-next.p-product-slider__next.slick-arrow');
            for (let i = 0; i < maxClicks; i++) {
                if (btn) {
                    btn.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
    });

    const items = await page.evaluate(() => {
        const itemList = [];
        document.querySelectorAll('.p-product-slider__list').forEach(slider => {
            slider.querySelectorAll('.p-product-list__item-inner').forEach(element => {
                const title = element.querySelector('.p-product-list__title')?.innerText.trim();
                const link = "https://example.com" + element.querySelector('a')?.getAttribute('href');
                const image = element.querySelector('img')?.getAttribute('src');
                const price = element.querySelector('.p-price__offscreen')?.innerText.trim();
                const discount = element.querySelector('.p-price__discount-per')?.innerText.trim();
                const status = element.querySelector('.c-label--info')?.innerText.trim();

                itemList.push({
                    title,
                    link,
                    image,
                    price,
                    discount,
                    status,
                });
            });
        });
        return itemList;
    });

    await browser.close();
    return items;
};

async function scrapePage(page, pageNum) {
    const BASE_URL = "https://otakumode.com/shop/figures-dolls?page=";
    await page.goto(`${BASE_URL}${pageNum}`, { waitUntil: "networkidle2" });

    // Wait for product list to load
    await page.waitForSelector(".p-product-list__item-inner");

    // Extract product data
    const products = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".p-product-list__item-inner")).map(product => {
            const titleElement = product.querySelector(".p-product-list__title");
            let priceElement = product.querySelector(".p-price__regular");
            let discount = product.querySelector(".p-price__discount-per");
            const imageElement = product.querySelector(".p-product-list__thumb img");
            const linkElement = product.querySelector(".p-product-list__thumb");
            const isNew = product.parentElement.classList.contains('p-product-list__item--new');
            const inStock = !Boolean(product.querySelector('.c-label--outofstock'))

            if (discount) {
                const match = discount.textContent.trim().match(/\d+/)
                discount = match ? match[0] : null;
            }

            if (!priceElement) {
                priceElement = product.querySelector(".p-price__offscreen");
            }

            return {
                title: titleElement ? titleElement.textContent.trim() : null,
                price: priceElement ? priceElement.textContent.trim() : null,
                discount: discount,
                image: imageElement ? imageElement.src : null,
                id: linkElement ? linkElement.getAttribute("href").slice(6) : null,
                isNew: isNew,
                inStock: inStock,
            };
        });
    })
    return products;
}

export const scrapeAllPages = async () => {

    const START_PAGE = 1
    const TOTAL_PAGES = 240

    const browser = await puppeteer.launch({ headless: true });
    const detailedProducts = [];
    const pageChunks = [];

    for (let i = START_PAGE; i <= TOTAL_PAGES; i += 5) {
        pageChunks.push(Array.from({ length: 5 }, (_, k) => i + k).filter(pageNum => pageNum <= TOTAL_PAGES));
    }

    console.time('Operation took')

    for (let chunkIndex = 0; chunkIndex < pageChunks.length; chunkIndex++) {
        const chunk = pageChunks[chunkIndex];
        process.stdout.write(`\rLoading ${chunkIndex + 1}/${pageChunks.length}`)

        const promises = chunk.map(async (pageNum) => {
            const page = await browser.newPage();
            const products = await scrapePage(page, pageNum);
            await page.close();
            return products;
        });

        const results = await Promise.all(promises);
        detailedProducts.push(...results.flat());
    }
    console.log('\r')

    console.timeEnd('Operation took')

    await browser.close();

    // Save data to a JSON file
    fs.writeFileSync("otakumode_products.json", JSON.stringify(detailedProducts, null, 2));
    console.log("Scraping complete! Data saved to otakumode_products.json");
    return detailedProducts;
};

export const extraDetails = async (req, res) => {

    const products = readProducts()
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--no-zygote",
        ]
    })

    const page = await browser.newPage()

    await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/"
    })
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    console.log('starting')
    console.time(`Operation took`)
    const detailedProducts = await scrapeProductDetailsInParallel(products, browser, 10)
    console.log('\n')
    console.timeEnd(`Operation took`)


    fs.writeFileSync("FINISHED.json", JSON.stringify(detailedProducts, null, 2))

    await browser.close()
    res.json(detailedProducts)
}


const productsFilePath = path.resolve(__dirname, 'otakumode_products.json');

const readProducts = () => {
    if (fs.existsSync(productsFilePath)) {
        const data = fs.readFileSync(productsFilePath, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}

const scrapeProductDetailsInParallel = async (products, browser, maxTabs) => {
    const detailedProducts = [];
    const productChunks = [];

    for (let i = 0; i < products.length; i += maxTabs) {
        productChunks.push(products.slice(i, i + maxTabs));
    }

    for (let chunkIndex = 0; chunkIndex < productChunks.length; chunkIndex++) {
        const chunk = productChunks[chunkIndex];

        process.stdout.write(`\rScraping chunk ${chunkIndex + 1}/${productChunks.length}\n`)

        const promises = chunk.map(async (product, i) => {
            const page = await browser.newPage();
            // page.on('console', msg => {
            //     process.stdout.write(`\rError: ${msg.text()}\nScraping chunk ${chunkIndex + 1}/${productChunks.length}`)
            //     // process.stdout.write('\x1b[1B\x1b[2K\x1b[1A\r');
            // })
            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            const detailedProduct = await scrapeProductDetails(page, product);
            await page.close();
            return detailedProduct;
        })


        const results = await Promise.all(promises);
        detailedProducts.push(...results);
    }

    return detailedProducts;
};

const scrapeProductDetails = async (page, product) => {
    const url = `https://otakumode.com/shop/${product.id}`;
    process.stdout.write(`\r waiting for page to load\x1b[K`)
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.setRequestInterception(true)
    page.setDefaultNavigationTimeout(0);

    page.on('request', (req) => {
        if (["stylesheet", "font"].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    process.stdout.write(`\r waiting for images\x1b[K`)
    await page.waitForSelector('.c-slick-image__thumbs.slick-initialized.slick-slider.slick-vertical')
    process.stdout.write(`\r getting images\x1b[K`)

    const details = await page.evaluate(async () => {

        const getImages = async () => {
            const imgs = Array.from(document.querySelectorAll('.c-slick-image__thumbs.slick-initialized.slick-slider.slick-vertical .slick-slide:not(.slick-cloned) img')).map(e => {
                return e.src
            })

            const filteredImages = new Set();

            while (filteredImages.size !== imgs.length) {
                const images = Array.from(document.querySelectorAll('.c-slick-image__thumbs.slick-initialized.slick-slider.slick-vertical .slick-slide:not(.slick-cloned) img'));

                for (const img of images) {
                    if (!img.src) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        continue;
                    }
                    if (img.src !== "https://dzt1km7tv28ex.cloudfront.net/static/shop/product_no_image.png") {
                        filteredImages.add(img.src.split('/').slice(-1)[0]);
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        continue;
                    }
                }
            }
            return [...filteredImages];
        };

        return await getImages();
    })

    process.stdout.write(`\r getting description\x1b[K`)
    const description = await page.evaluate(async () => {
        const warning = document.querySelector('.c-docs.c-docs__markdown.u-fs-sm')
        const body1 = Array.from(document.querySelectorAll('.c-docs.c-docs__markdown:not(.u-fs-sm)'))[0]
        const body2 = Array.from(document.querySelectorAll('.c-docs.c-docs__markdown:not(.u-fs-sm)'))[1]
        return {
            warning: warning ? warning.innerHTML : null,
            body1: body1 ? body1.innerHTML : null,
            body2: body2 ? body2.innerHTML : null,
        }
    })
    process.stdout.write(`\r getting tags\x1b[K`)

    const tags = await page.evaluate(async () => {
        return Array.from(document.querySelectorAll('.js-test__labels a')).map(el => {
            return el.textContent
        })
    })

    process.stdout.write(`\r getting ratings\x1b[K`)
    const ratings = await page.evaluate(() => {
        const rateDiv = document.querySelector(".p-rateGraph")
        if (!rateDiv) {
            return [
                { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            ]
        }
        return Array.from(document.querySelectorAll(".p-rateGraph__histLine")).map((line, i) => {
            const count = line.querySelector(".p-rateGraph__histCount")?.textContent.trim();

            return {
                stars: 5 - i,
                count: count ? parseInt(count) : 0
            };
        });
    });

    return { ...product, moreImages: details, tags: tags, description: description, ratings };
};