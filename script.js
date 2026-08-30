function scrollToTools() {
    document.getElementById("tools").scrollIntoView({
        behavior: "smooth"
    });
}


function showMessage() {
    alert(
        "CivilTech is a civil engineering platform designed to provide practical engineering tools."
    );
}


function openTool(toolName) {

    if (toolName === "Unit Converter") {

        window.location.href = "tools/conversions.html";

    } else {

        alert(
            toolName + " will be available soon."
        );

    }
}
