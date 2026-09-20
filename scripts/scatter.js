// Healthcare spending vs life expectancy
function scatterPlot() {
    // chart properties
    let w = 800;
    let h = 500;
    let padding = 60;
    let year = 2022;

    let dataset;

    // load the data and convert the numeric columns
    d3.csv("data/health_data.csv", function(d) {
        return {
            country: d.country,
            code: d.code,
            year: +d.year,
            spending: +d.spending,
            lifeExpectancy: +d.life_expectancy
        };
    }).then(function(data) {
        // keep one year so each country appears once
        dataset = data.filter(function(d) {
            return d.year === year;
        });

        drawChart(dataset);
    });

    function drawChart(dataset) {
        let xScale = d3.scaleLinear()
            .domain([0, d3.max(dataset, function(d) {
                return d.spending;
            })])
            .range([padding, w - padding])
            .nice();

        let yScale = d3.scaleLinear()
            .domain([d3.min(dataset, function(d) {
                return d.lifeExpectancy;
            }) - 2, d3.max(dataset, function(d) {
                return d.lifeExpectancy;
            }) + 1])
            .range([h - padding, padding])
            .nice();

        let xAxis = d3.axisBottom()
            .ticks(8)
            .scale(xScale);

        let yAxis = d3.axisLeft()
            .ticks(8)
            .scale(yScale);

        let svg = d3.select("#chart")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        // one circle per country, Australia drawn larger and in a different colour
        svg.selectAll("circle")
            .data(dataset)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return xScale(d.spending);
            })
            .attr("cy", function(d) {
                return yScale(d.lifeExpectancy);
            })
            .attr("r", function(d) {
                if (d.code === "AUS") {
                    return 7;
                } else {
                    return 5;
                }
            })
            .attr("fill", pointColour)
            .on("mouseover", function(event, d) {
                let xPosition = parseFloat(d3.select(this).attr("cx"));
                let yPosition = parseFloat(d3.select(this).attr("cy")) - 15;

                svg.append("text")
                    .attr("id", "tooltip")
                    .attr("x", xPosition)
                    .attr("y", yPosition)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("font-weight", "bold")
                    .text(d.country + ": $" + d.spending + ", " + d.lifeExpectancy + " years");

                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", "orange");
            })
            .on("mouseout", function() {
                d3.select("#tooltip").remove();
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", pointColour);
            });

        // label Australia so users can find it without hovering
        svg.selectAll("text.label")
            .data(dataset.filter(function(d) {
                return d.code === "AUS";
            }))
            .enter()
            .append("text")
            .attr("class", "label")
            .text(function(d) {
                return d.country;
            })
            .attr("x", function(d) {
                return xScale(d.spending) + 12;
            })
            .attr("y", function(d) {
                return yScale(d.lifeExpectancy) + 4;
            })
            .attr("fill", "orangered")
            .attr("font-size", "12px")
            .attr("font-weight", "bold");

        svg.append("g")
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("transform", "translate(" + padding + ",0)")
            .call(yAxis);

        // axis titles
        svg.append("text")
            .attr("x", w / 2)
            .attr("y", h - 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "13px")
            .text("Healthcare spending per person (USD PPP, " + year + ")");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -h / 2)
            .attr("y", 18)
            .attr("text-anchor", "middle")
            .attr("font-size", "13px")
            .text("Life expectancy at birth (years)");
    }

    // used when drawing circles and when restoring colour after a hover
    function pointColour(d) {
        if (d.code === "AUS") {
            return "orangered";
        } else {
            return "dodgerblue";
        }
    }
}
