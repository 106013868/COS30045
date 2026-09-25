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
            region: d.region,
            year: +d.year,
            spending: +d.spending,
            lifeExpectancy: +d.life_expectancy
        };
    }).then(function(data) {
        dataset = data;

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
            .text("Healthcare spending per person (USD PPP)");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -h / 2)
            .attr("y", 18)
            .attr("text-anchor", "middle")
            .attr("font-size", "13px")
            .text("Life expectancy at birth (years)");


        function selectedRegions() {
            let regions = [];

            d3.selectAll(".regionBox").each(function() {
                if (this.checked) {
                    regions.push(this.value);
                }
            });

            return regions;
        }

        function updateChart(year) {
            let regions = selectedRegions();

            let yearData = dataset.filter(function(d) {
                return d.year === year && regions.includes(d.region);
            });

            // key by country code so each circle stays with the same country across years
            let circles = svg.selectAll("circle")
                .data(yearData, function(d) {
                    return d.code;
                });

            // remove countries with no data for this year
            circles.exit().remove();

            let circlesEnter = circles.enter()
                .append("circle")
                .attr("r", function(d) {
                    if (d.code === "AUS") {
                        return 7;
                    } else {
                        return 5;
                    }
                })
                .attr("fill", pointColour)
                .attr("cx", function(d) {
                    return xScale(d.spending);
                })
                .attr("cy", function(d) {
                    return yScale(d.lifeExpectancy)
                })
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
            circlesEnter.merge(circles)
                .transition()
                .duration(500)
                .attr("cx", function(d) {
                    return xScale(d.spending);
                })
                .attr("cy", function(d) {
                    return yScale(d.lifeExpectancy);
            });

            let label = svg.selectAll("text.label")
                .data(yearData.filter(function(d) {
                    return d.code === "AUS";
                }));
            
            label.exit().remove();

            label.enter()
                .append("text")
                .attr("class", "label")
                .text(function(d) {
                    return d.country;
                })
                .attr("fill", "orangered")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("x", function(d) {
                    return xScale(d.spending) + 12;
                })
                .attr("y", function(d) {
                    return yScale(d.lifeExpectancy) + 4;
                })
                .merge(label)
                .transition()
                .duration(500)
                .attr("x", function(d) {
                    return xScale(d.spending) + 12;
                })
                .attr("y", function(d) {
                    return yScale(d.lifeExpectancy) + 4;
            })
        }

        updateChart(year);

        d3.select("#controls")
            .style("margin-left", padding + "px")

        // slider changes the year shown
        d3.select("#yearSlider")
            .style("display", "block")
            .style("width", (w - padding * 2) + "px")
            .on("input", function() {
                year = +this.value;
                d3.select("#yearLabel").text(year);
                updateChart(year);
            });

        d3.selectAll(".regionBox")
            .on("change", function() {
                updateChart(year);
            });
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
