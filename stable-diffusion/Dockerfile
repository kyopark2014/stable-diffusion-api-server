FROM amazon/aws-lambda-python:3.8

RUN pip3 install --upgrade pip
RUN pip3 install scikit-build wheel 
RUN pip3 install opencv-python==4.6.0.66 

RUN python -m pip install joblib awsiotsdk pandas
RUN yum install libglvnd-glx -y
RUN python -m pip install dlr
RUN pip3 install dlr==1.6.0

WORKDIR /var/task/image-classifier

COPY inference.py /var/task
COPY classifier.py /var/task

COPY . .

CMD ["classifier.run"]