
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                                       
% Backpropagation, in matrix notation.                          
%                                                               
% Written in 1997 by Rajeev Raizada,                            
%                    Dept. of Cognitive and Neural Systems,     
%                    Boston University.                         
%                                                               
% E.mail: rajeev@cns.bu.edu                                     
%                                                               
% Implemented in Matlab (a product of The MathWorks, Inc.)      
% Note: x'      is the transpose of matrix x                    
%       x.*y    is the element-by-element product of x and y    
%               (as opposed to x*y,the standard matrix product)  
% See the end of the listing for explanation of the matrices.   
%                                                               
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%%%%%%%%%%%%%%%%%%% Initial setting up of the variables

patterns = [0 0; 0 1; 1 0; 1 1];   % The input patterns for the XOR problem
desired_out = [ 0; 1; 1; 0];       % The corresponding XOR desired outputs
sse_rec = [];   % Will hold a record of all sum-squared-errors. Nice to plot
sse = 10;       % A dummy initial sse. Must be large, for the "while" below
eta = 1;        % Learning rate. Note: eta = 1 is very large.
                % For XOR, this converges fast, but can get stuck in loc. mins.
alpha = 0.8;    % Momentum term
patterns = [patterns ones(size(patterns,1),1) ];       
                % Add a column of 1's to patterns to make a bias node
num_inp = size(patterns,2);     % No. of input nodes (including bias)
                % Note: size(x,2) is Matlab for the no. of columns in matrix x
num_hid = 3;                    % No. of hidden nodes (including bias node)
num_out = size(desired_out,2);          % No. of output nodes
%%%%%%% Giving the weights small initial values in range [-0.5,0.5] %%%%%%%%%
w1 = 0.5*(1-2*rand(num_inp,num_hid-1)); 
        % Input to hidden weights. NB: no weights to bias hidden node
w2 = 0.5*(1-2*rand(num_hid,num_out));   % Hidden-to-output weights
        % Note: rand(rows,cols) is a matrix of random numbers of that size
dw1_last = zeros(size(w1));             % Last w1 change, set to a zero matrix
dw2_last = zeros(size(w2));             % Last w2 change, set to a zero matrix
epoch = 0;                              % Initialise count of training epochs

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Main loop 

while sse > 0.01                        % When sse is low enough, we'll stop
        winp_into_hid = patterns * w1;  % Pass patterns through weights
        hid_act = 1./(1+exp( - winp_into_hid)); % Sigmoid of weighted input
        hid_with_bias = [ hid_act ones(size(hid_act,1),1) ];    % Add bias node
        winp_into_out = hid_with_bias * w2; % Pass hidden acts through weights
        out_act = 1./(1+exp( - winp_into_out)); % Sigmoid of input to output 
        output_error = desired_out - out_act;   % Error matrix
        sse = trace(output_error'*output_error); % Sum sqr error, matrix style
        sse_rec = [sse_rec sse];                 % Record keeping
        deltas_out = output_error .* out_act .* (1-out_act);
                                                % delta=dE/do * do/dnet
        deltas_hid = deltas_out*w2' .* hid_with_bias .* (1-hid_with_bias);
        deltas_hid(:,size(deltas_hid,2)) = [];  
                        % Take out error signals for bias node
        dw1 = eta * patterns' * deltas_hid + alpha * dw1_last;   
                        % The key backprop step, in matrix form
        dw2 = eta * hid_with_bias' * deltas_out + alpha * dw2_last;
        w1 = w1 + dw1; w2 = w2 + dw2;           % Weight update
        dw1_last = dw1; dw2_last = dw2;         % Update momentum records
        epoch = epoch + 1;
        if rem(epoch,50)==0     % Every 50 epochs, show how training is doing
                 disp([' Epoch ' num2str(epoch) '  SSE ' num2str(sse)]);
        end
end     %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% End of main loop

figure(1);
plot(sse_rec); xlabel('Epochs'); ylabel('Sum squared error (SSE)'); % The end


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Note: This algorithm is simply standard backprop, but using 
%       matrices instead of summing over indices.
%       To understand it, try rewriting it in the standard
%       Rumelhart and McClelland w_{ij} style notation.
%
% Explanation of the matrices used:
% The i,j-th entry (row i, column j) of each matrix is:
%
%       patterns        j-th element of i-th pattern
%                       No. of columns = No. of input nodes
%
%       desired_out     Desired activity of j-th output node
%                       when i-th pattern is presented
%
% NOTE: The sizes of the matrices determine how many input and output nodes
%       the network has.
%       No. of input nodes = No. of columns in the matrix "patterns" 
%       No. of output nodes = No. of columns in the matrix "desired_out" 
% The number of hidden nodes can be set independently. 
% In the present program, for the XOR problem, it is 2, plus a bias, giving 3
%
%       w1              Weight from i-th input node to
%                       the j-th hidden node
% 
%       winp_into_hid   Weighted input to j-th hidden node
%                       when i-th pattern is presented
%
%       hid_act         Activity of j-th hidden node when
%                       i-th pattern is presented.
%                       This is the weighted input, passed
%                       through a sigmoid function
%
%       hid_with_bias   Same as hid_act but with a bias node
%                       added, which always has activity of 1.
%                       This forms the last column - all 1's.
%                       See below for discussion of biases.
%
%       w2              Weight from i-th hidden node to
%                       the j-th output node
% 
%       winp_into_out   Weighted input to j-th output node
%                       when i-th pattern is presented
%
%       out_act         Activity of j-th output node when
%                       i-th pattern is presented.
%
%       output_error    Difference between desired and actual
%                       activity of j-th output node
%                       when i-th pattern is presented
%
%       deltas_out      Error signal for j-th output node when
%                       i-th pattern is presented.
%                       This would be a matrix of delta_{pj}
%                       elements in Rumelhart & McClelland notation
%
%       deltas_hid      Error signal for j-th hidden node when
%                       i-th pattern is presented.
%                       This would be a matrix of delta_{pj}
%                       elements in Rumelhart & McClelland notation
%
%       dw1             Change to the w1 matrix after one complete
%                       pass through the patterns (they are all presented
%                       at once as the matrix called "patterns")
%                       The i,j-th element is the change to  
%                       the weight from i-th input node to
%                       the j-th hidden node
%
%       dw2             Change to the w2 matrix
%                       The i,j-th element is the change to  
%                       the weight from i-th hidden node to
%                       the j-th output node
%
%       dw1_last        The change to w1 made during the last 
%                       training epoch. Used for momentum
%
%       dw2_last        The change to w2 made during the last 
%                       training epoch. 
%
%  The bias nodes:
%       A bias feeding into the hidden layer is equivalent to having an input
%       node always set to 1. Similarly, a bias into the output layer is
%       just having a hidden node always set to 1.
%
%       This is achieved by adding a column of 1's to the right hand sides
%       of the matrices "patterns" (which is what the input node activities
%       get set to) and "hid_act". The matrix of hidden node activities WITH
%       the bias column of 1's is called "hid_with_bias".
%
%  I hope that's all clear! Please e.mail any questions or comments to:
%                       
%                       rajeev@cns.bu.edu
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
