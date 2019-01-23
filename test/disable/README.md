## Difference between travis and local test regarding result of geoip

*Test temporary disable*


#### TRAVIS (KO)

received { ip: '173.194.45.67',
  city: '',
  country: 'US',
  region: '',
  latitude: 37.751,
  longitude: -97.822 }

expected { ip: '173.194.45.67',
  city: 'Mountain View',
  country: 'US',
  region: 'NA',
  latitude: 37.4192,
  longitude: -122.0574 }


 #### LOCAL (OK)

 received { ip: '173.194.45.67',
  city: 'Mountain View',
  country: 'US',
  region: 'NA',
  latitude: 37.4192,
  longitude: -122.0574 }

expected { ip: '173.194.45.67',
  city: 'Mountain View',
  country: 'US',
  region: 'NA',
  latitude: 37.4192,
  longitude: -122.0574 }
