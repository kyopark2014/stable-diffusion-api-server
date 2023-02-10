# SageMaker JumpStart로 Stable Diffusion Endpoint 생성

SageMaker Studio를 처음 실행하는 경우이라면 [SageMaker Console에 접속](https://ap-northeast-2.console.aws.amazon.com/sagemaker/home?region=ap-northeast-2#/studio/)하여 [Create domain]을 선택합니다. 편의상 서울 리전에서 모든 동작을 수행합니다. 이후 아래처럼 Domain name을 입력하고 User profile과 Execution role은 기본값을 유지한 상태에서 [Submit]을 선택합니다. 여기서는 Doamin name으로 "MyStableDiffusion"을 입력하였습니다.

![noname](https://user-images.githubusercontent.com/52392004/217717253-08a486aa-2746-4e88-8142-7f5505bd657c.png)

이후 아래처럼 VPC와 Subnet을 생성합니다. 

![noname](https://user-images.githubusercontent.com/52392004/217717601-94b9fc9a-7a93-4824-bfe5-b9b6504e8fe5.png)

[SageMaker Studio Console](https://ap-northeast-2.console.aws.amazon.com/sagemaker/home?region=ap-northeast-2#/studio-landing)에서 기 생성한 "MyStableDiffusion"을 선택한 후에 [Create user profile]을 선택하고 이후 아래처럼 기본값으로 [Next]를 선택합니다. 이후 [Jupyter Lab 3.0]등을 기본값으로 선택후 [Submit]을 선택하여 user profile를 생성합니다. 

![noname](https://user-images.githubusercontent.com/52392004/217718224-6bc40589-33a6-459d-b015-d824ad67e0cd.png)

다시 [SageMaker Studio Console](https://ap-northeast-2.console.aws.amazon.com/sagemaker/home?region=ap-northeast-2#/studio-landing)에서 "MyStableDiffusion"을 [Open Studio]를 선택합니다. 이후 아래처럼 [Home] 화면에서 [JumpStart]를 선택합니다. 

![noname](https://user-images.githubusercontent.com/52392004/218072014-28a5d530-2fc8-4d23-ad57-ab99d449b499.png)


아래처럼 [Stable Diffusion 2.1 base]를 선택합니다. 만약 화면에 보이지 않는 경우에 [Search]에서 "Stable Diffusion"을 입력하여 선택합니다. 

![noname](https://user-images.githubusercontent.com/52392004/217719500-f2315a2a-3317-4dec-9134-9d46604e3b2c.png)

아래처럼 [Open nodebook]을 선택합니다. 

![noname](https://user-images.githubusercontent.com/52392004/217719762-24f63090-8aad-4c44-8f56-4decb8bc20fa.png)

"Introduction to JumpStart - Text to Image"이 오픈되면 아래로 스크롤해서 “Clean up the endpoint”를 주석처리 합니다. 

![noname](https://user-images.githubusercontent.com/52392004/218053016-3163d02a-3720-4b03-aa39-92a3e276abea.png)





"Introduction to JumpStart - Text to Image" 노트북이 오픈되면 상단의 [Run]을 선택한 후에 [Run All Cells]을 선택하여 노트북을 실행시킵니다. 수십분 정도가 지나면 노트북에 모든 Cell이 수행이 되면서 SageMaker Endpoint도 생성됩니다. 

![noname](https://user-images.githubusercontent.com/52392004/217720256-8bfbefc0-3171-449c-a4d6-748bf9803a0d.png)

노트북 실행이 완료되면 왼쪽 메뉴의 [Deployment] - [Endpoint]를 선택하여, 생성된 Endpoint 정보를 아래처럼 확인합니다.  

![noname](https://user-images.githubusercontent.com/52392004/217720687-9a53ca9f-e245-4b3a-a9d6-db59cdff6113.png)

생성된 Endpoint를 선택하여 들어간 후에 [ENDPOINT DETAILS]에서 Endpoint 이름을 복사합니다. 여기서는 "jumpstart-example-infer-model-txt2img-s-2023-02-08-13-53-49-534"을 복사하였습니다.  

![noname](https://user-images.githubusercontent.com/52392004/217721132-d8fdb8b1-fdd7-45ca-bc82-a6bbbc292549.png)

