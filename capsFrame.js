function myFunction() {
    pixels = pictureData("inputPicture");
    var img = document.getElementById("inputPicture");
    width = img.width;
    height = img.height;
    squareSize = Number(document.getElementById("squareSizeField").value);
    k = document.getElementById("kField").value;
    maxIterations = document.getElementById("maxIterationsField").value;
    backgroundColor = document.getElementById("colorField").value;
    backgroundColor = hexToColor(backgroundColor);

    kMeansResults = kMeans(pixels, k, maxIterations);
    prunedColors = kMeanResultsToColors(kMeansResults);

    capsed = capsPicture(prunedColors, squareSize, backgroundColor);

    setRenderCanvas("renderCanvas", capsed.colors);

    document.getElementById("demo").innerHTML = capsed.nbCaps + " caps";
}

function hexToColor(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function capsPicture(colors, squareSize) {
    oldWidth = colors.length;
    oldHeight = colors[0].length;
    newWidth = Math.floor(oldWidth / squareSize) * squareSize;
    newHeight = Math.floor(oldHeight / squareSize) * squareSize;
    nbSquares = Math.floor(oldWidth / squareSize) * Math.floor(oldHeight / squareSize);

    offsetX = Math.floor((oldWidth - newWidth) / 2);
    offsetY = Math.floor((oldHeight - newHeight) / 2);

    newColors = [];
    for (i = 0; i < newWidth; ++i) {
        newColors[i] = [];
        for (j = 0; j < newHeight; ++j) {
            newColors[i][j] = randomColor();
        }
    }

    for (i = 0; i < newWidth; i = i + squareSize) {

        for (j = 0; j < newHeight; j = j + squareSize) {
            mainColor = getMainColor(colors, i + offsetX, j + offsetY, squareSize, squareSize);
            for (m = 0; m < squareSize; ++m) {
                for (n = 0; n < squareSize; ++n) {
                    newColors[i + m][j + n] = mainColor;
                }
            }
        }
    }

    return {
        colors: newColors,
        nbCaps: nbSquares
    };
}

function getMainColor(colors, x, y, width, height) {
    colorsIn = [];

    function indexColorIn(colorsIn, color) {
        for (it = 0; it < colorsIn.length; ++it) {
            if (equalsColors(colorsIn[it].color, color)) {
                return it;
            }
        }
        return -1;
    }

    for (o = x; o < x + width; ++o) {
        for (p = y; p < y + height; ++p) {
            if (colorsIn.length > 0) {
                indexColor = indexColorIn(colorsIn, colors[i][j]);
                if (indexColor >= 0) {
                    colorsIn[indexColor].count++;
                } else {
                    colorsIn.push({
                        color: colors[i][j],
                        count: 1
                    });
                }
            } else {
                colorsIn.push({
                    color: colors[i][j],
                    count: 1
                });
            }
        }
    }

    idMaxCount = 0;
    for (o = 1; o < colorsIn.length; ++o) {
        if (colorsIn.count > colorsId[idMaxCount].count) {
            idMaxCount = o;
        }
    }

    return colorsIn[idMaxCount].color;
}

function kMeanResultsToColors(kMeanResults) {
    colors = [];
    clusters = kMeanResults.clusters;
    means = kMeanResults.means;
    for (i = 0; i < clusters.length; ++i) {
        colors[i] = [];
        for (j = 0; j < clusters[i].length; ++j) {
            colors[i][j] = means[clusters[i][j]];
        }
    }
    return colors;
}

function setRenderCanvas(renderCanvasId, colors) {
    width = colors.length;
    height = colors[0].length;

    var c = document.getElementById(renderCanvasId);
    c.width = width;
    c.height = height;

    var ctx = c.getContext("2d");
    ctx.fillStyle = color2rgbText(randomColor());
    ctx.fillRect(0, 0, width, height);
    for (i = 0; i < width; ++i) {
        for (j = 0; j < height; ++j) {
            ctx.fillStyle = color2rgbText(colors[i][j]);
            ctx.fillRect(i, j, 1, 1);
        }
    }
}

function equalsColors(colorA, colorB) {
    if (colorA.r == colorB.r && colorA.g == colorB.g && colorA.b == colorB.b) {
        return true;
    } else {
        return false;
    }
}

function color(red, green, blue) {
    return {
        r: red,
        g: green,
        b: blue
    };
}

function color2rgbText(color) {
    return "rgb(" + color.r + "," + color.g + "," + color.b + ")";
}

function colorsSquareDistance(colorA, colorB) {
    return (colorA.r - colorB.r) * (colorA.r - colorB.r) + (colorA.g - colorB.g) * (colorA.g - colorB.g) + (colorA.b - colorB.b) * (colorA.b - colorB.b);
}

function addColors(colorA, colorB) {
    return {
        r: colorA.r + colorB.r,
        g: colorA.g + colorB.g,
        b: colorA.b + colorB.b
    };
}

function divideColor(color, div) {
    if (div <= 0) return color;
    else return {
        r: (color.r / div),
        g: (color.g / div),
        b: (color.b / div)
    };
}

function floorColor(color) {
    return {
        r: Math.floor(color.r),
        g: Math.floor(color.g),
        b: Math.floor(color.b)
    };
}

function pictureData(pictureId) {
    var img = document.getElementById(pictureId);
    img.crossOrigin = "Anonymous";
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);

    pixels = [];

    for (i = 0; i < img.width; ++i) {
        pixels[i] = [];
        var pixelData = canvas.getContext('2d').getImageData(i, 0, 1, img.height).data;
        for (j = 0; j < img.height; ++j) {
            pixels[i][j] = color(pixelData[j * 4], pixelData[j * 4 + 1], pixelData[j * 4 + 2]);
        }
    }

    return pixels;
}

function pictureData2ColorArray(pictureData) {
    colors = [];
    for (i = 0; i < pictureData.length; i += 4) {
        var color = {
            r: pictureData[i],
            g: pictureData[i + 1],
            b: pictureData[i + 2]
        };
        colors.push(color);
    }
    return colors;
}

function random(min, max) {
    return Math.floor((Math.random() * (max - min)) + min);
}

function randomColor() {
    return {
        r: random(0, 255),
        g: random(0, 255),
        b: random(0, 255)
    };
}

function getClosestId(color, colorClusters) {
    minId = 0;
    minSquareDist = colorsSquareDistance(color, colorClusters[0]);
    for (it = 1; it < colorClusters.length; ++it) {
        squareDist = colorsSquareDistance(color, colorClusters[it]);
        if (squareDist < minSquareDist) {
            minSquareDist = squareDist;
            minId = it;
        }
    }
    return minId;
}

function kMeans(colors, k, maxIterations) {
    means = [];
    clusters = [];
    for (i = 0; i < k; i++) {
        var rnd = randomColor();
        means.push(rnd);
    }

    for (iteration = 0; iteration < maxIterations; ++iteration) {
        numberPerClusters = [];
        newMeans = [];
        for (i = 0; i < k; ++i) {
            numberPerClusters.push(0);
            newMeans.push({
                r: 0,
                g: 0,
                b: 0
            });
        }
        clusters = [];
        for (i = 0; i < colors.length; ++i) {
            clusters[i] = [];
            for (j = 0; j < colors[i].length; ++j) {
                closestId = getClosestId(colors[i][j], means);
                clusters[i][j] = closestId;
                numberPerClusters[closestId]++;
                newMeans[closestId] = addColors(newMeans[closestId], colors[i][j]);
            }
        }
        for (i = 0; i < k; ++i) {
            means[i] = divideColor(newMeans[i], numberPerClusters[i]);
        }
    }

    for (i = 0; i < k; ++i) {
        means[i] = floorColor(means[i]);
    }

    return {
        means: means,
        clusters: clusters
    };
}