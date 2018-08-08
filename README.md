# Google Charts component for ManyWho

It is often useful in a Flow to show charts and graphs to the user. This component leverages the Google Charts library available here: https://developers.google.com/chart

## Install
Place a copy of the custom component from the dist folder in a publicly accessible location.

At the bottom of your player code add the following script tag:

```
<script>
    var googleChartsLoaded = false;
</script>
```
In your player code add the following custom resources to the manywho object:
```
customResources: ['https://www.gstatic.com/charts/loader.js', '<web address of the custom component>'],
```