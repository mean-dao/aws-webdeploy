# Cloudfront Manager

GitHub Action for updating the Origin Path for given Distribution

## Inputs
*details will be added...*

## Usage Example

````yaml
name: Deployment
jobs:
  deploy:
    name: Package
    steps:
      - uses: actions/checkout@v3
      # your stuff

      # Configure AWS credentials
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_DEFAULT_REGION }}
          
      # Update the Origin Path
      - name: Update OriginPath
        uses: mean-dao/aws-web-deploy@v1
        with:
          ORIGIN_PATH: '/v1/new_path'
          AWS_DISTRIBUTION_ID: ${{ secrets.DISTRIBUTION_ID }}
````
