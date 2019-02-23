'use strict';

function initMap() {
    let startMapsPos, endMapsPos;

    const options = {
        center: {lat: -25.363, lng: 131.044},
        zoom: 5,
    };

    const map = new google.maps.Map(
        document.getElementById("map"), options
    );

    let promise = new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition((pos) => {
            let currentPos = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            };
            resolve(currentPos);
        });
    });

    promise.then((currentPos) => {
        document.forms.coords.start.value = currentPos.lat + ', ' + currentPos.lng;

        const currentMapsPos = new google.maps.LatLng(currentPos.lat, currentPos.lng);
        startMapsPos = currentMapsPos;

        map.setCenter(currentMapsPos);
        const startMarker = new google.maps.Marker({
            position: currentMapsPos,
            map: map
        });
    });

    document.forms.coords.addEventListener('submit', (event) => {
        const directionsService = new google.maps.DirectionsService;
        const directionsDisplay = new google.maps.DirectionsRenderer({map: map});

        const [endPosLat, endPosLng] = document.forms.coords.end.value.split(', ');
        endMapsPos = new google.maps.LatLng(endPosLat, endPosLng);

        const endMarker = new google.maps.Marker({
            position: endMapsPos,
            map: map
        });

        const request = {
            origin: document.forms.coords.start.value,
            destination: document.forms.coords.end.value,
            travelMode: 'DRIVING'
        };

        directionsService.route(request, (response, status) => {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);

                const distanceInKm = response.routes[0].legs[0].distance.value / 1000;
                const halfDistanceInKm = distanceInKm / 2;

                let path = response.routes[0].overview_path;
                path = path.map((item) => {
                    return {lat: item.lat(), lng: item.lng()};
                });

                let overcomeDistance = 0;
                let i;
                for (i = 0; i < path.length - 1; i++) {
                    overcomeDistance += distanceInKmBetweenEarthCoordinates(path[i].lat, path[i].lng, path[i+1].lat, path[i+1].lng);
                    if (overcomeDistance >= halfDistanceInKm) break;
                }

                const middlePos = path[i];
                const middleMapsPos = new google.maps.LatLng(middlePos);
                const middleMarker = new google.maps.Marker({
                    position: middleMapsPos,
                    map: map
                });
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });

    });
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function distanceInKmBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;

    const dLat = degreesToRadians(lat2-lat1);
    const dLon = degreesToRadians(lon2-lon1);

    lat1 = degreesToRadians(lat1);
    lat2 = degreesToRadians(lat2);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return earthRadiusKm * c;
}
