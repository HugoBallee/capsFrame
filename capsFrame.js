function myFunction() {
    var pixels = pictureData("inputPicture");
    var img = document.getElementById("inputPicture");
    var width = img.width;
    var height = img.height;
    var squareSize = Number(document.getElementById("squareSizeField").value);
    var k = document.getElementById("kField").value;
    var maxIterations = document.getElementById("maxIterationsField").value;
    var backgroundColor = document.getElementById("colorField").value;
    backgroundColor = ColorFromHex(backgroundColor);
    var quincux = document.getElementById("quincux").checked;
    
    var kMeansResults = kMeans(pixels, k, maxIterations);
    var prunedColors = kMeanResultsToColors(kMeansResults);

    var capsed = capsPicture(prunedColors, squareSize, backgroundColor, quincux);

    setRenderCanvas("renderCanvas", capsed.colors);

    document.getElementById("demo").innerHTML = capsed.nbCaps + " caps";
}

function capsPicture(colors, squareSize, backgroundColor, quincunx) {
    var oldWidth = colors.length;
    var oldHeight = colors[0].length;
    var newWidth = Math.floor(oldWidth / squareSize) * squareSize;
    var newHeight = Math.floor(oldHeight / squareSize) * squareSize;
    var nbSquares = Math.floor(oldWidth / squareSize) * Math.floor(oldHeight / squareSize);

    var offsetX = Math.floor((oldWidth - newWidth) / 2);
    var offsetY = Math.floor((oldHeight - newHeight) / 2);

    var newColors = [];
    for (var i = 0; i < newWidth; ++i) {
        newColors[i] = [];
        for (var j = 0; j < newHeight; ++j)
            newColors[i][j] = ColorRandom();
    }

    if (quincunx) {
        for (i = 0; i < newWidth; i = i+1)
            for (j = 0; j < newHeight; j = j+1)
                newColors[i][j] = backgroundColor;
    } else {
        var hSquareSize = squareSize * 0.5;
        for (i = 0; i < newWidth; i = i + squareSize) {
            for (j = 0; j < newHeight; j = j + squareSize) {
                var mainColor = getMainColor(colors, i + offsetX, j + offsetY, squareSize, squareSize);
                var center = {x:i+hSquareSize, y:j+hSquareSize};
                for (var m = 0; m < squareSize; ++m) {
                    for (var n = 0; n < squareSize; ++n) {
                        var point = {x:(i+m), y:(j+n)};
                        if (isInCircle(center, hSquareSize, point))
                            newColors[i + m][j + n] = mainColor;
                        else
                            newColors[i + m][j + n] = backgroundColor;
                    }
                }
            }
        }
    }

    return { colors: newColors, nbCaps: nbSquares };
}

function isInCircle(center, radius, point) {
    return squareDist(center, point) <= (radius*radius);
}

function squareDist(pointA, pointB) {
    return (pointA.x - pointB.x) * (pointA.x - pointB.x) + (pointA.y - pointB.y) * (pointA.y - pointB.y);
}

function getMainColor(colors, x, y, width, height) {
    var colorsIn = [];

    function indexColorIn(colorsIn, color) {
        for (var it = 0; it < colorsIn.length; ++it)
            if (color.equals(colorsIn[it].color))
                return it;
        return -1;
    }

    for (var o = x; o < x + width; ++o) {
        for (var p = y; p < y + height; ++p) {
            if (colorsIn.length > 0) {
                var indexColor = indexColorIn(colorsIn, colors[o][p]);
                if (indexColor >= 0)
                    colorsIn[indexColor].count++;
                else
                    colorsIn.push({ color: colors[o][p], count: 1 });
            } else
                colorsIn.push({ color: colors[o][p], count: 1 });
        }
    }

    var idMaxCount = 0;
    for (o = 1; o < colorsIn.length; ++o)
        if (colorsIn.count > colorsIn[idMaxCount].count)
            idMaxCount = o;

    return colorsIn[idMaxCount].color;
}

function kMeanResultsToColors(kMeanResults) {
    var colors = [];
    var clusters = kMeanResults.clusters;
    var means = kMeanResults.means;
    for (var i = 0; i < clusters.length; ++i) {
        colors[i] = [];
        for (var j = 0; j < clusters[i].length; ++j)
            colors[i][j] = means[clusters[i][j]];
    }
    return colors;
}

function setRenderCanvas(renderCanvasId, colors) {
    var width = colors.length;
    var height = colors[0].length;

    var c = document.getElementById(renderCanvasId);
    c.width = width;
    c.height = height;

    var ctx = c.getContext("2d");
    ctx.fillStyle = ColorRandom().toString();
    ctx.fillRect(0, 0, width, height);
    for (var i = 0; i < width; ++i) {
        for (var j = 0; j < height; ++j) {
            ctx.fillStyle = colors[i][j].toString();
            ctx.fillRect(i, j, 1, 1);
        }
    }
}

function pictureData(pictureId) {
    var img = document.getElementById(pictureId);
    img.crossOrigin = "Anonymous";
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);

    var pixels = [];

    for (var i = 0; i < img.width; ++i) {
        pixels[i] = [];
        var pixelData = canvas.getContext('2d').getImageData(i, 0, 1, img.height).data;
        for (var j = 0; j < img.height; ++j)
            pixels[i][j] = new Color(pixelData[j*4], pixelData[j*4+1], pixelData[j*4+2]);
    }

    return pixels;
}

function getClosestId(color, colorClusters) {
    var minId = 0;
    var minSquareDist = color.squareDistance(colorClusters[0]);
    for (var it = 1; it < colorClusters.length; ++it) {
        var squareDist = color.squareDistance(colorClusters[it]);
        if (squareDist < minSquareDist) {
            minSquareDist = squareDist;
            minId = it;
        }
    }
    return minId;
}

function kMeans(colors, k, maxIterations) {
    var means = [];
    var clusters = [];
    for (var i = 0; i < k; i++)
        means.push(ColorRandom());

    for (var iteration = 0; iteration < maxIterations; ++iteration) {
        var numberPerClusters = [];
        var newMeans = [];
        for (i = 0; i < k; ++i) {
            numberPerClusters.push(0);
            newMeans.push(new Color(0, 0, 0));
        }
        clusters = [];
        for (i = 0; i < colors.length; ++i) {
            clusters[i] = [];
            for (var j = 0; j < colors[i].length; ++j) {
                var closestId = getClosestId(colors[i][j], means);
                clusters[i][j] = closestId;
                numberPerClusters[closestId]++;
                newMeans[closestId] = newMeans[closestId].add(colors[i][j]);
            }
        }
        for (i = 0; i < k; ++i)
            means[i] = newMeans[i].divide(numberPerClusters[i]);
    }

    for (i = 0; i < k; ++i)
        means[i] = means[i].floor();

    return { means: means, clusters: clusters };
}

function Color(red, green, blue) {
    this.r = red;
    this.g = green;
    this.b = blue;
    
    this.equals = function(color) {
        if (this.r == color.r && this.g == color.g && this.b == color.b)
            return true;
        else
            return false;
    };
    
    this.add = function(color) {
        return new Color(
            this.r + color.r,
            this.g + color.g,
            this.b + color.b);
    };
    
    this.divide = function(f) {
        if (f <= 0)
            return this;
        return new Color(this.r / f, this.g / f, this.b / f);
    };
    
    this.floor = function() {
        return new Color(
            Math.floor(this.r),
            Math.floor(this.g),
            Math.floor(this.b));
    };
    
    this.squareDistance = function(color) {
        return (
            (this.r - color.r) * (this.r - color.r) +
            (this.g - color.g) * (this.g - color.g) +
            (this.b - color.b) * (this.b - color.b));
    };
    
    this.toString = function()  {
        return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
    };
}

function ColorFromHex(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) 
        return new Color(
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16));
    else
        return new Color(255, 0, 255);
}

function ColorRandom() {
    var min = 0;
    var max = 0;
    return new Color(
        Math.floor((Math.random() * (max - min)) + min),
        Math.floor((Math.random() * (max - min)) + min),
        Math.floor((Math.random() * (max - min)) + min));
}